import { eq } from 'drizzle-orm';
import type { Db } from '../../db';
import { users } from '../../db/schema';

export type User = typeof users.$inferSelect;

export interface TelegramProfile {
  telegramId: number;
  fullName: string;
  username: string | null;
  photoUrl: string | null;
}

// Creates the user on first login and refreshes their Telegram profile after.
// Returns whether the account is new so the caller can route to onboarding.
export async function upsertTelegramUser(db: Db, profile: TelegramProfile): Promise<{ user: User; isNew: boolean }> {
  const [existing] = await db.select().from(users).where(eq(users.telegramId, profile.telegramId));
  const profileFields = {
    fullName: profile.fullName,
    username: profile.username,
    // The bot cannot hand out a public photo URL, so keep what we already have.
    photoUrl: profile.photoUrl ?? existing?.photoUrl ?? null,
  };
  if (existing) {
    const [user] = await db.update(users).set(profileFields).where(eq(users.id, existing.id)).returning();
    return { user, isNew: false };
  }
  const [user] = await db
    .insert(users)
    .values({ telegramId: profile.telegramId, ...profileFields })
    .onConflictDoUpdate({ target: users.telegramId, set: profileFields })
    .returning();
  return { user, isNew: true };
}
