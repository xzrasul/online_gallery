import { gte, inArray } from 'drizzle-orm';
import { getDb } from '../../../src/db';
import { artworks, sellerApplications, users } from '../../../src/db/schema';
import { TEST_TELEGRAM_ID_MIN } from '../../helpers/test-telegram-id';

// Removes every user created by tests (fake Telegram ids >= TEST_TELEGRAM_ID_MIN)
// together with the rows that reference them, so interrupted runs leave nothing behind.
export async function deleteTestUsers(): Promise<void> {
  const db = getDb();
  const testUsers = await db.select({ id: users.id }).from(users).where(gte(users.telegramId, TEST_TELEGRAM_ID_MIN));
  const ids = testUsers.map((u) => u.id);
  if (ids.length === 0) return;

  await db.update(sellerApplications).set({ reviewedByAdminId: null }).where(inArray(sellerApplications.reviewedByAdminId, ids));
  await db.update(artworks).set({ reviewedByAdminId: null }).where(inArray(artworks.reviewedByAdminId, ids));
  await db.delete(artworks).where(inArray(artworks.sellerId, ids));
  await db.delete(sellerApplications).where(inArray(sellerApplications.userId, ids));
  await db.delete(users).where(inArray(users.id, ids));
}
