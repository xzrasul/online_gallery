import { NextResponse, type NextRequest } from 'next/server';
import { getDb } from '@/src/db';
import { LOGIN_REQUEST_COOKIE, LOGIN_REQUEST_TTL_SECONDS, createLoginRequest } from '@/src/lib/auth/bot-login';
import { LOGIN_NEXT_COOKIE, safeNextPath } from '@/src/lib/auth/next-path';

// Starts a "sign in via the bot" request and returns the t.me deep link.
// The raw token stays in an httpOnly cookie so only this browser can finish it;
// an optional { next } (where to return after signing in) rides along the same way.
export async function POST(req: NextRequest) {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  if (!botUsername) {
    return NextResponse.json({ error: 'Telegram login is not configured' }, { status: 500 });
  }

  const body: unknown = await req.json().catch(() => null);
  const next = safeNextPath(body && typeof body === 'object' ? (body as { next?: unknown }).next : null);

  const { token } = await createLoginRequest(getDb());
  const res = NextResponse.json({ botUrl: `https://t.me/${botUsername}?start=${token}` });
  const cookie = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/auth/bot',
    maxAge: LOGIN_REQUEST_TTL_SECONDS,
  };
  res.cookies.set(LOGIN_REQUEST_COOKIE, token, cookie);
  if (next) res.cookies.set(LOGIN_NEXT_COOKIE, next, cookie);
  else res.cookies.delete({ name: LOGIN_NEXT_COOKIE, path: '/auth/bot' });
  return res;
}
