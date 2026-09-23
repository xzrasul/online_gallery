import { describe, it, expect, afterEach } from 'vitest';
import { eq, inArray } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { loginRequests, users } from '../../src/db/schema';
import {
  LOGIN_REQUEST_TTL_SECONDS,
  confirmLoginRequest,
  consumeLoginRequest,
  createLoginRequest,
  findPendingLoginRequest,
} from '../../src/lib/auth/bot-login';
import { testTelegramId } from '../helpers/test-telegram-id';

describe('bot login requests', () => {
  const requestIds: string[] = [];
  const telegramIds: number[] = [];

  afterEach(async () => {
    if (requestIds.length) await getDb().delete(loginRequests).where(inArray(loginRequests.id, requestIds));
    if (telegramIds.length) await getDb().delete(users).where(inArray(users.telegramId, telegramIds));
    requestIds.length = 0;
    telegramIds.length = 0;
  });

  function profile(label: string) {
    const telegramId = testTelegramId(label);
    telegramIds.push(telegramId);
    return { telegramId, fullName: 'Бот Тест', username: 'bot_test', photoUrl: null };
  }

  it('goes pending -> confirmed -> consumed exactly once', async () => {
    const { id, token } = await createLoginRequest(getDb());
    requestIds.push(id);

    expect(await findPendingLoginRequest(getDb(), token)).toEqual({ id });
    expect(await consumeLoginRequest(getDb(), token)).toEqual({ status: 'pending' });

    expect(await confirmLoginRequest(getDb(), id, profile('bot_login_happy'))).toBe(true);
    // A second press of the button does nothing.
    expect(await confirmLoginRequest(getDb(), id, profile('bot_login_happy'))).toBe(false);
    expect(await findPendingLoginRequest(getDb(), token)).toBeNull();

    const result = await consumeLoginRequest(getDb(), token);
    expect(result.status).toBe('done');
    const [user] = await getDb().select().from(users).where(eq(users.telegramId, testTelegramId('bot_login_happy')));
    expect(result).toEqual({ status: 'done', userId: user.id, isNewUser: true });
    expect(user.fullName).toBe('Бот Тест');

    expect(await consumeLoginRequest(getDb(), token)).toEqual({ status: 'expired' });
  });

  it('marks a returning user as not new', async () => {
    const first = await createLoginRequest(getDb());
    const second = await createLoginRequest(getDb());
    requestIds.push(first.id, second.id);

    await confirmLoginRequest(getDb(), first.id, profile('bot_login_returning'));
    await confirmLoginRequest(getDb(), second.id, profile('bot_login_returning'));

    expect(await consumeLoginRequest(getDb(), second.token)).toMatchObject({ status: 'done', isNewUser: false });
  });

  it('refuses expired requests', async () => {
    const past = new Date(Date.now() - (LOGIN_REQUEST_TTL_SECONDS + 60) * 1000);
    const { id, token } = await createLoginRequest(getDb(), past);
    requestIds.push(id);

    expect(await findPendingLoginRequest(getDb(), token)).toBeNull();
    expect(await confirmLoginRequest(getDb(), id, profile('bot_login_expired'))).toBe(false);
    expect(await consumeLoginRequest(getDb(), token)).toEqual({ status: 'expired' });
  });

  it('treats unknown or malformed tokens as expired', async () => {
    expect(await consumeLoginRequest(getDb(), undefined)).toEqual({ status: 'expired' });
    expect(await consumeLoginRequest(getDb(), 'x'.repeat(43))).toEqual({ status: 'expired' });
    expect(await consumeLoginRequest(getDb(), 'bad token')).toEqual({ status: 'expired' });
  });
});
