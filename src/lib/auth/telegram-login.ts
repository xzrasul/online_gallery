import { hmacSha256, safeEqual, sha256, toHex } from './crypto';

export interface TelegramProfile {
  telegramId: number;
  fullName: string;
  username: string | null;
  photoUrl: string | null;
}

// Telegram signs the login payload; a day-old login link is no longer accepted.
const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

// Verifies data returned by the Telegram Login Widget:
// https://core.telegram.org/widgets/login#checking-authorization
export async function verifyTelegramLogin(
  params: Record<string, string>,
  botToken: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<TelegramProfile | null> {
  const { hash, ...fields } = params;
  if (!hash || !fields.id || !fields.auth_date || !fields.first_name) return null;

  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join('\n');
  const secretKey = await sha256(botToken);
  const expected = toHex(await hmacSha256(secretKey, dataCheckString));
  if (!safeEqual(expected, hash.toLowerCase())) return null;

  const authDate = Number(fields.auth_date);
  if (!Number.isFinite(authDate) || nowSeconds - authDate > MAX_AUTH_AGE_SECONDS) return null;

  const telegramId = Number(fields.id);
  if (!Number.isSafeInteger(telegramId) || telegramId <= 0) return null;

  return {
    telegramId,
    fullName: [fields.first_name, fields.last_name].filter(Boolean).join(' '),
    username: fields.username || null,
    photoUrl: fields.photo_url || null,
  };
}
