import { NextResponse } from 'next/server';
import { getDb } from '@/src/db';
import { afterSignInPath, setSessionCookie } from '@/src/lib/auth/session';
import { upsertTelegramUser } from '@/src/lib/auth/users';

// Development and e2e only: signs in as an arbitrary Telegram id without going
// through the bot. Disabled in every production build (including Vercel previews).
export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not found', { status: 404 });
  }

  const params = new URL(req.url).searchParams;
  const telegramId = Number(params.get('id'));
  if (!Number.isSafeInteger(telegramId) || telegramId <= 0) {
    return new Response('Pass a positive integer ?id=', { status: 400 });
  }

  const { user, isNew } = await upsertTelegramUser(getDb(), {
    telegramId,
    fullName: params.get('name') || `Тестовый пользователь ${telegramId}`,
    username: params.get('username'),
    photoUrl: null,
  });
  return setSessionCookie(NextResponse.redirect(new URL(afterSignInPath(isNew), req.url), 303), user.id);
}
