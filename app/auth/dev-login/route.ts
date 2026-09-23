import { signInResponse, upsertTelegramUser } from '@/src/lib/auth/session';

// Development and e2e only: the Telegram widget refuses to run on localhost,
// so this signs in as an arbitrary Telegram id without a signature.
// It is disabled in every production build (including Vercel previews).
export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not found', { status: 404 });
  }

  const params = new URL(req.url).searchParams;
  const telegramId = Number(params.get('id'));
  if (!Number.isSafeInteger(telegramId) || telegramId <= 0) {
    return new Response('Pass a positive integer ?id=', { status: 400 });
  }

  const { user, isNew } = await upsertTelegramUser({
    telegramId,
    fullName: params.get('name') || `Тестовый пользователь ${telegramId}`,
    username: params.get('username'),
    photoUrl: null,
  });
  return signInResponse(req, user, isNew);
}
