// One-off: creates the artwork_likes table (src/db/schema.ts) in the database
// from DATABASE_URL. Additive only — nothing existing is changed — and safe to
// re-run (it does nothing if the table is already there). Equivalent to the
// artwork_likes part of `drizzle-kit push`, without touching any other table.
//
//   npx dotenv -e .env.local -- npx tsx scripts/add-artwork-likes-table.ts
import { sql } from 'drizzle-orm';
import { getDb } from '../src/db';

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "artwork_likes" (
    "user_id" uuid NOT NULL,
    "artwork_id" uuid NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "artwork_likes_user_id_artwork_id_pk" PRIMARY KEY("user_id","artwork_id")
  )`,
  `DO $$ BEGIN
    ALTER TABLE "artwork_likes" ADD CONSTRAINT "artwork_likes_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
    ALTER TABLE "artwork_likes" ADD CONSTRAINT "artwork_likes_artwork_id_artworks_id_fk"
      FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "artwork_likes_artwork_id_idx" ON "artwork_likes" USING btree ("artwork_id")`,
];

async function main() {
  const db = getDb();
  await db.transaction(async (tx) => {
    for (const statement of STATEMENTS) await tx.execute(sql.raw(statement));
  });
  const columns = await db.execute(
    sql`select column_name, data_type from information_schema.columns where table_name = 'artwork_likes' order by ordinal_position`,
  );
  console.log('artwork_likes columns:', columns.map((c) => `${c.column_name}:${c.data_type}`).join(', '));
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
