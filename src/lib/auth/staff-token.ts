import { encoder, fromBase64Url, hmacSha256, safeEqual, toBase64Url } from './crypto';

// Staff (admin and moderator) sign in at /sanatadmin with a login and password,
// not Telegram. Their session is its own cookie, separate from the site's
// Telegram session, and shorter-lived. Web Crypto only, so middleware can read it.

export const STAFF_COOKIE = 'staff';
export const STAFF_MAX_AGE_SECONDS = 12 * 60 * 60;

export type StaffRole = 'admin' | 'moderator';

interface StaffPayload {
  role: StaffRole;
  exp: number;
}

// Signed over a "staff." prefix so a site session token can never pass as a staff one.
const sign = async (body: string, secret: string) =>
  toBase64Url(await hmacSha256(encoder.encode(secret), `staff.${body}`));

export async function createStaffToken(
  role: StaffRole,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<string> {
  const payload: StaffPayload = { role, exp: nowSeconds + STAFF_MAX_AGE_SECONDS };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  return `${body}.${await sign(body, secret)}`;
}

// The role from a valid, unexpired staff token, otherwise null.
export async function readStaffToken(
  token: string | undefined,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<StaffRole | null> {
  if (!token) return null;
  const [body, signature, ...rest] = token.split('.');
  if (!body || !signature || rest.length) return null;
  if (!safeEqual(await sign(body, secret), signature)) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as StaffPayload;
    if (payload.role !== 'admin' && payload.role !== 'moderator') return null;
    if (typeof payload.exp !== 'number' || payload.exp <= nowSeconds) return null;
    return payload.role;
  } catch {
    return null;
  }
}
