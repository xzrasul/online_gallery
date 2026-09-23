import postgres from 'postgres';

// One-off: copies every row from the old Neon database (SOURCE_DATABASE_URL)
// into Supabase (DATABASE_URL), keeping ids. Run after `drizzle-kit push` has
// created the schema in Supabase. Existing rows are left alone, so re-running is safe.
const TABLES = ['users', 'categories', 'techniques', 'seller_applications', 'artworks', 'login_requests'] as const;

async function main() {
  const sourceUrl = process.env.SOURCE_DATABASE_URL;
  const targetUrl = process.env.DATABASE_URL;
  if (!sourceUrl || !targetUrl) throw new Error('Set SOURCE_DATABASE_URL (Neon) and DATABASE_URL (Supabase)');
  if (sourceUrl === targetUrl) throw new Error('Source and target are the same database');

  const source = postgres(sourceUrl, { max: 1 });
  const target = postgres(targetUrl, { max: 1, prepare: false, ssl: 'require' });
  try {
    for (const table of TABLES) {
      const rows = await source`select * from ${source(table)}`;
      if (rows.length > 0) {
        await target`insert into ${target(table)} ${target(rows as unknown as Record<string, unknown>[])} on conflict do nothing`;
      }
      const [{ n }] = await target`select count(*)::int as n from ${target(table)}`;
      console.log(`${table.padEnd(20)} source ${String(rows.length).padStart(3)} -> target ${n}`);
    }
  } finally {
    await source.end();
    await target.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
