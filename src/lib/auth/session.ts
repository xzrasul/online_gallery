import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { cache } from 'react';
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
import type { User } from './users';

export type CurrentUser = User;

// The signed-in user from the session cookie, or null for anonymous visitors.
// Cached per request: the header and the page share one database round trip.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = await readSessionToken(token, getSessionSecret());
  if (!userId) return null;
  const [user] = await getDb().select().from(users).where(eq(users.id, userId));
  return user ?? null;
});

export { afterSignInPath } from './next-path';

export async function setSessionCookie(res: NextResponse, userId: string): Promise<NextResponse> {
  res.cookies.set(SESSION_COOKIE, await createSessionToken(userId, getSessionSecret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
