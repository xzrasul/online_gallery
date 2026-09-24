import { NextResponse, type NextRequest } from 'next/server';
import { getDb } from '@/src/db';
import { LOGIN_REQUEST_COOKIE, consumeLoginRequest } from '@/src/lib/auth/bot-login';
import { LOGIN_NEXT_COOKIE, safeNextPath } from '@/src/lib/auth/next-path';
import { afterSignInPath, setSessionCookie } from '@/src/lib/auth/session';

// Polled by the sign-in page until the user confirms in the bot.
export async function POST(req: NextRequest) {
  const result = await consumeLoginRequest(getDb(), req.cookies.get(LOGIN_REQUEST_COOKIE)?.value);
  if (result.status !== 'done') {
    return NextResponse.json({ status: result.status });
  }

  const next = safeNextPath(req.cookies.get(LOGIN_NEXT_COOKIE)?.value);
  const res = NextResponse.json({ status: 'done', redirect: afterSignInPath(result.isNewUser, next) });
  res.cookies.delete({ name: LOGIN_REQUEST_COOKIE, path: '/auth/bot' });
  res.cookies.delete({ name: LOGIN_NEXT_COOKIE, path: '/auth/bot' });
  return setSessionCookie(res, result.userId);
}
