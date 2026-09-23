import { NextResponse } from 'next/server';
import { getDb } from '@/src/db';
import { LOGIN_REQUEST_COOKIE, LOGIN_REQUEST_TTL_SECONDS, createLoginRequest } from '@/src/lib/auth/bot-login';

// Starts a "sign in via the bot" request and returns the t.me deep link.
// The raw token stays in an httpOnly cookie so only this browser can finish it.
export async function POST() {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  if (!botUsername) {
    return NextResponse.json({ error: 'Telegram login is not configured' }, { status: 500 });
  }

  const { token } = await createLoginRequest(getDb());
  const res = NextResponse.json({ botUrl: `https://t.me/${botUsername}?start=${token}` });
  res.cookies.set(LOGIN_REQUEST_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth/bot',
    maxAge: LOGIN_REQUEST_TTL_SECONDS,
  });
  return res;
}
