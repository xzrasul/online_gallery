import { describe, it, expect } from 'vitest';
import { createSessionToken, readSessionToken, SESSION_MAX_AGE_SECONDS } from '../../src/lib/auth/session-token';

const SECRET = 'x'.repeat(32);
const NOW = 1_800_000_000;
const USER_ID = '6f1c2f3e-6b0a-4b8e-9d2a-0c1e2f3a4b5c';

describe('session token', () => {
  it('round-trips the user id', async () => {
    const token = await createSessionToken(USER_ID, SECRET, NOW);
    expect(await readSessionToken(token, SECRET, NOW + 10)).toBe(USER_ID);
  });

  it('rejects an expired token', async () => {
    const token = await createSessionToken(USER_ID, SECRET, NOW);
    expect(await readSessionToken(token, SECRET, NOW + SESSION_MAX_AGE_SECONDS)).toBeNull();
  });

  it('rejects a token signed with another secret', async () => {
    const token = await createSessionToken(USER_ID, 'y'.repeat(32), NOW);
    expect(await readSessionToken(token, SECRET, NOW)).toBeNull();
  });

  it('rejects a token whose payload was swapped', async () => {
    const [, signature] = (await createSessionToken(USER_ID, SECRET, NOW)).split('.');
    const [otherBody] = (await createSessionToken('another-user', SECRET, NOW)).split('.');
    expect(await readSessionToken(`${otherBody}.${signature}`, SECRET, NOW)).toBeNull();
  });

  it('rejects missing and malformed tokens', async () => {
    expect(await readSessionToken(undefined, SECRET, NOW)).toBeNull();
    expect(await readSessionToken('garbage', SECRET, NOW)).toBeNull();
    expect(await readSessionToken('a.b.c', SECRET, NOW)).toBeNull();
  });
});
