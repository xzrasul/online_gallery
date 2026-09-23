import { NextResponse, type NextRequest } from 'next/server';
import { getDb } from '@/src/db';
import { LOGIN_REQUEST_COOKIE, consumeLoginRequest } from '@/src/lib/auth/bot-login';
import { afterSignInPath, setSessionCookie } from '@/src/lib/auth/session';

// Polled by the sign-in page until the user confirms in the bot.
export async function POST(req: NextRequest) {
  const result = await consumeLoginRequest(getDb(), req.cookies.get(LOGIN_REQUEST_COOKIE)?.value);
  if (result.status !== 'done') {
    return NextResponse.json({ status: result.status });
  }

  const res = NextResponse.json({ status: 'done', redirect: afterSignInPath(result.isNewUser) });
  res.cookies.delete({ name: LOGIN_REQUEST_COOKIE, path: '/auth/bot' });
  return setSessionCookie(res, result.userId);
}
