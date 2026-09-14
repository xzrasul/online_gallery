import { eq } from 'drizzle-orm';
import { getDb } from '../src/db';
import { users } from '../src/db/schema';
import { syncRoleToClerk } from '../src/lib/auth/sync-role';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: tsx scripts/promote-to-admin.ts <email>');
    process.exit(1);
  }

  const [user] = await getDb().select().from(users).where(eq(users.email, email));
  if (!user) {
    console.error(`No user found with email ${email}. They must sign up first.`);
    process.exit(1);
  }

  await getDb().update(users).set({ role: 'admin' }).where(eq(users.id, user.id));

  try {
    await syncRoleToClerk(user.clerkUserId, 'admin');
  } catch (err) {
    console.warn(
      `WARNING: DB role updated to admin for ${email}, but syncing to Clerk metadata failed:`,
      err,
    );
  }

  console.log(`Promoted ${email} to admin.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
