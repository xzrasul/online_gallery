import { neon } from '@neondatabase/serverless';

// One-off migration from Clerk to Telegram login. Deletes every user together
// with their seller applications and artworks (categories and techniques stay),
// then reshapes `users` to match src/db/schema.ts. Runs in one transaction.
async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  const [{ exists }] = await sql`
    select exists (
      select 1 from information_schema.columns
      where table_name = 'users' and column_name = 'clerk_user_id'
    ) as exists`;
  if (!exists) {
    console.log('users has no clerk_user_id column: already migrated, nothing to do.');
    return;
  }

  await sql.transaction([
    sql`TRUNCATE artworks, seller_applications, users`,
    sql`ALTER TABLE users
          DROP COLUMN clerk_user_id,
          DROP COLUMN email,
          ADD COLUMN telegram_id bigint NOT NULL,
          ADD COLUMN username text,
          ADD COLUMN photo_url text`,
    sql`ALTER TABLE users ADD CONSTRAINT users_telegram_id_unique UNIQUE (telegram_id)`,
  ]);

  const columns = await sql`
    select column_name from information_schema.columns
    where table_name = 'users' order by ordinal_position`;
  console.log('Migrated. users columns:', columns.map((c) => c.column_name).join(', '));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
