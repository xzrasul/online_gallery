import { NextResponse } from 'next/server';
import { signInResponse, upsertTelegramUser } from '@/src/lib/auth/session';
import { verifyTelegramLogin } from '@/src/lib/auth/telegram-login';

// The Telegram Login Widget redirects here with the signed profile in the query string.
export async function GET(req: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return new Response('Telegram login is not configured', { status: 500 });
  }

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const profile = await verifyTelegramLogin(params, botToken);
  if (!profile) {
    return NextResponse.redirect(new URL('/sign-in?error=telegram', req.url), 303);
  }

  const { user, isNew } = await upsertTelegramUser(profile);
  return signInResponse(req, user, isNew);
}
