import { neon } from '@neondatabase/serverless';

// One-off: adds the login_requests table used by "sign in via the bot".
// Additive and idempotent — safe to run more than once, touches no other table.
async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    CREATE TABLE IF NOT EXISTS login_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      token_hash text NOT NULL,
      user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      is_new_user boolean NOT NULL DEFAULT false,
      created_at timestamp NOT NULL DEFAULT now(),
      expires_at timestamp NOT NULL,
      confirmed_at timestamp,
      consumed_at timestamp,
      CONSTRAINT login_requests_token_hash_unique UNIQUE (token_hash)
    )`;
  const columns = await sql`
    select column_name from information_schema.columns
    where table_name = 'login_requests' order by ordinal_position`;
  console.log('login_requests columns:', columns.map((c) => c.column_name).join(', '));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
