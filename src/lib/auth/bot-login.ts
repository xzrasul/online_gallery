import { and, eq, gt, isNotNull, isNull, lt } from 'drizzle-orm';
import type { Db } from '../../db';
import { loginRequests } from '../../db/schema';
import { encoder, hmacSha256, sha256, toBase64Url, toHex } from './crypto';
import { upsertTelegramUser, type TelegramProfile } from './users';

export const LOGIN_REQUEST_COOKIE = 'login_request';
export const LOGIN_REQUEST_TTL_SECONDS = 10 * 60;

// Telegram allows up to 64 chars of [A-Za-z0-9_-] in a /start payload.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,64}$/;

export function generateLoginToken(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function hashLoginToken(token: string): Promise<string> {
  return toHex(await sha256(token));
}

// "/start <token>" (optionally "/start@botname <token>") -> token.
export function parseStartPayload(text: string | undefined): string | null {
  const match = text?.trim().match(/^\/start(?:@\w+)?\s+(\S+)$/);
  return match && TOKEN_PATTERN.test(match[1]) ? match[1] : null;
}

export function confirmCallbackData(requestId: string): string {
  return `login:${requestId}`;
}

export function parseConfirmCallback(data: string | undefined): string | null {
  const match = data?.match(/^login:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/);
  return match ? match[1] : null;
}

// Secret Telegram echoes in X-Telegram-Bot-Api-Secret-Token on every webhook
// call; derived from SESSION_SECRET so no extra env var is needed.
export async function webhookSecret(sessionSecret: string): Promise<string> {
  return toHex(await hmacSha256(encoder.encode(sessionSecret), 'telegram-webhook'));
}

export async function createLoginRequest(db: Db, now = new Date()): Promise<{ id: string; token: string }> {
  // Housekeeping: requests are useless once expired; keep a day for debugging.
  await db.delete(loginRequests).where(lt(loginRequests.expiresAt, new Date(now.getTime() - 24 * 60 * 60 * 1000)));

  const token = generateLoginToken();
  const [row] = await db
    .insert(loginRequests)
    .values({
      tokenHash: await hashLoginToken(token),
      expiresAt: new Date(now.getTime() + LOGIN_REQUEST_TTL_SECONDS * 1000),
    })
    .returning({ id: loginRequests.id });
  return { id: row.id, token };
}

// The request a bot /start payload refers to, if it can still be confirmed.
export async function findPendingLoginRequest(db: Db, token: string, now = new Date()) {
  const [row] = await db
    .select({ id: loginRequests.id })
    .from(loginRequests)
    .where(
      and(
        eq(loginRequests.tokenHash, await hashLoginToken(token)),
        isNull(loginRequests.confirmedAt),
        gt(loginRequests.expiresAt, now),
      ),
    );
  return row ?? null;
}

// Called when the Telegram user presses "Confirm" in the bot.
export async function confirmLoginRequest(
  db: Db,
  requestId: string,
  profile: TelegramProfile,
  now = new Date(),
): Promise<boolean> {
  const [pending] = await db
    .select({ id: loginRequests.id })
    .from(loginRequests)
    .where(and(eq(loginRequests.id, requestId), isNull(loginRequests.confirmedAt), gt(loginRequests.expiresAt, now)));
  if (!pending) return false;

  const { user, isNew } = await upsertTelegramUser(db, profile);
  const updated = await db
    .update(loginRequests)
    .set({ userId: user.id, isNewUser: isNew, confirmedAt: now })
    .where(and(eq(loginRequests.id, requestId), isNull(loginRequests.confirmedAt)))
    .returning({ id: loginRequests.id });
  return updated.length === 1;
}

export type LoginPollResult =
  | { status: 'pending' }
  | { status: 'expired' }
  | { status: 'done'; userId: string; isNewUser: boolean };

// Polled by the browser that started the login. Succeeds exactly once.
export async function consumeLoginRequest(db: Db, token: string | undefined, now = new Date()): Promise<LoginPollResult> {
  if (!token || !TOKEN_PATTERN.test(token)) return { status: 'expired' };
  const tokenHash = await hashLoginToken(token);

  const [consumed] = await db
    .update(loginRequests)
    .set({ consumedAt: now })
    .where(
      and(
        eq(loginRequests.tokenHash, tokenHash),
        isNotNull(loginRequests.confirmedAt),
        isNull(loginRequests.consumedAt),
        gt(loginRequests.expiresAt, now),
      ),
    )
    .returning({ userId: loginRequests.userId, isNewUser: loginRequests.isNewUser });
  if (consumed?.userId) return { status: 'done', userId: consumed.userId, isNewUser: consumed.isNewUser };

  const [row] = await db
    .select({ expiresAt: loginRequests.expiresAt, consumedAt: loginRequests.consumedAt })
    .from(loginRequests)
    .where(eq(loginRequests.tokenHash, tokenHash));
  if (!row || row.consumedAt || row.expiresAt <= now) return { status: 'expired' };
  return { status: 'pending' };
}
