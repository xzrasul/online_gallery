import postgres from 'postgres';
import { getStorageClient } from '../src/lib/uploads/upload-image';
import { AVATARS_BUCKET, BANNERS_BUCKET } from '../src/lib/uploads/buckets';

// The light redesign's database and storage changes. Only additions, so it is
// safe to run again: existing rows are left as they are.
const SQL = `
alter table seller_applications add column if not exists avatar_url text;

alter table artworks add column if not exists year integer;
alter table artworks add column if not exists width_px integer;
alter table artworks add column if not exists height_px integer;

create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  image_mobile_url text,
  eyebrow text,
  title text not null,
  subtitle text,
  button_label text,
  button_url text,
  button2_label text,
  button2_url text,
  artwork_id uuid references artworks(id) on delete set null,
  overlay integer not null default 45,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists banners_active_order_idx on banners (is_active, sort_order);

-- The site reads and writes banners on the server (the admin check lives in
-- the server actions). Through Supabase's public API: anyone may read only the
-- active slides in their show window, and nobody may write.
alter table banners enable row level security;
drop policy if exists banners_public_read on banners;
create policy banners_public_read on banners for select
  using (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
`;

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false, ssl: 'require', max: 1 });
  try {
    await sql.unsafe(SQL);
    console.log('Database: columns and the banners table are in place.');
  } finally {
    await sql.end();
  }

  const { storage } = getStorageClient();
  for (const bucket of [BANNERS_BUCKET, AVATARS_BUCKET]) {
    const options = { public: true, fileSizeLimit: '5MB', allowedMimeTypes: ['image/jpeg', 'image/webp', 'image/png'] };
    const { data: existing } = await storage.getBucket(bucket);
    const { error } = existing ? await storage.updateBucket(bucket, options) : await storage.createBucket(bucket, options);
    if (error) throw error;
    console.log(`Bucket "${bucket}" ${existing ? 'updated' : 'created'} (public read, uploads from the server only).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
