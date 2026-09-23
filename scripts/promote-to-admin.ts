import { eq } from 'drizzle-orm';
import { getDb } from '../src/db';
import { users } from '../src/db/schema';

// Accepts a numeric Telegram id or a Telegram username (with or without @).
async function main() {
  const who = process.argv[2]?.trim();
  if (!who) {
    console.error('Usage: tsx scripts/promote-to-admin.ts <telegram-id | @username>');
    process.exit(1);
  }

  const condition = /^\d+$/.test(who)
    ? eq(users.telegramId, Number(who))
    : eq(users.username, who.replace(/^@/, ''));
  const [user] = await getDb().select().from(users).where(condition);
  if (!user) {
    console.error(`No user found for ${who}. They must sign in with Telegram first.`);
    process.exit(1);
  }

  await getDb().update(users).set({ role: 'admin' }).where(eq(users.id, user.id));
  console.log(`Promoted ${user.fullName} (Telegram ${user.telegramId}) to admin.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
