import { encoder, fromBase64Url, hmacSha256, safeEqual, toBase64Url } from './crypto';

export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

interface SessionPayload {
  uid: string;
  exp: number;
}

// Token format: base64url(JSON payload) + "." + base64url(HMAC-SHA256 signature).
export async function createSessionToken(
  userId: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<string> {
  const payload: SessionPayload = { uid: userId, exp: nowSeconds + SESSION_MAX_AGE_SECONDS };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = toBase64Url(await hmacSha256(encoder.encode(secret), body));
  return `${body}.${signature}`;
}

// Returns the user id from a valid, unexpired token, otherwise null.
export async function readSessionToken(
  token: string | undefined,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<string | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [body, signature] = parts;

  const expected = toBase64Url(await hmacSha256(encoder.encode(secret), body));
  if (!safeEqual(expected, signature)) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload;
    if (typeof payload.uid !== 'string' || typeof payload.exp !== 'number') return null;
    if (payload.exp <= nowSeconds) return null;
    return payload.uid;
  } catch {
    return null;
  }
}

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set to at least 32 characters');
  }
  return secret;
}
