import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  getSessionSecret,
  readSessionToken,
} from './session-token';
import type { TelegramProfile } from './telegram-login';

export type CurrentUser = typeof users.$inferSelect;

// The signed-in user from the session cookie, or null for anonymous visitors.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = await readSessionToken(token, getSessionSecret());
  if (!userId) return null;
  const [user] = await getDb().select().from(users).where(eq(users.id, userId));
  return user ?? null;
}

// Creates the user on first login and refreshes their Telegram profile after.
// Returns whether the account is new so the caller can route to onboarding.
export async function upsertTelegramUser(profile: TelegramProfile): Promise<{ user: CurrentUser; isNew: boolean }> {
  const db = getDb();
  const [existing] = await db.select().from(users).where(eq(users.telegramId, profile.telegramId));
  if (existing) {
    const [user] = await db
      .update(users)
      .set({ fullName: profile.fullName, username: profile.username, photoUrl: profile.photoUrl })
      .where(eq(users.id, existing.id))
      .returning();
    return { user, isNew: false };
  }
  const [user] = await db
    .insert(users)
    .values(profile)
    .onConflictDoUpdate({
      target: users.telegramId,
      set: { fullName: profile.fullName, username: profile.username, photoUrl: profile.photoUrl },
    })
    .returning();
  return { user, isNew: true };
}

// Redirects a freshly signed-in user with the session cookie attached:
// new accounts pick a role first, returning users go to their cabinet.
export async function signInResponse(req: Request, user: CurrentUser, isNew: boolean): Promise<NextResponse> {
  const res = NextResponse.redirect(new URL(isNew ? '/choose-role' : '/cabinet', req.url), 303);
  res.cookies.set(SESSION_COOKIE, await createSessionToken(user.id, getSessionSecret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
