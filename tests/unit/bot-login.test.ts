import { describe, it, expect } from 'vitest';
import {
  confirmCallbackData,
  generateLoginToken,
  hashLoginToken,
  parseConfirmCallback,
  parseStartPayload,
  webhookSecret,
} from '../../src/lib/auth/bot-login';

const REQUEST_ID = '6f1c2f3e-6b0a-4b8e-9d2a-0c1e2f3a4b5c';

describe('bot login helpers', () => {
  it('generates tokens that fit a Telegram /start payload', () => {
    const token = generateLoginToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateLoginToken()).not.toBe(token);
  });

  it('hashes tokens deterministically', async () => {
    expect(await hashLoginToken('abc')).toBe(await hashLoginToken('abc'));
    expect(await hashLoginToken('abc')).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashLoginToken('abc')).not.toBe(await hashLoginToken('abd'));
  });

  it('extracts the token from /start commands', () => {
    const token = generateLoginToken();
    expect(parseStartPayload(`/start ${token}`)).toBe(token);
    expect(parseStartPayload(`/start@sanatplacebot ${token}`)).toBe(token);
    expect(parseStartPayload(`  /start ${token}  `)).toBe(token);
  });

  it('rejects /start without a valid token', () => {
    expect(parseStartPayload('/start')).toBeNull();
    expect(parseStartPayload('/start short')).toBeNull();
    expect(parseStartPayload('/start bad!chars_bad!chars_bad!chars_bad!chars')).toBeNull();
    expect(parseStartPayload('hello')).toBeNull();
    expect(parseStartPayload(undefined)).toBeNull();
  });

  it('round-trips the confirm callback data within Telegram limits', () => {
    const data = confirmCallbackData(REQUEST_ID);
    expect(new TextEncoder().encode(data).length).toBeLessThanOrEqual(64);
    expect(parseConfirmCallback(data)).toBe(REQUEST_ID);
    expect(parseConfirmCallback('login:not-a-uuid')).toBeNull();
    expect(parseConfirmCallback(undefined)).toBeNull();
  });

  it('derives a webhook secret Telegram accepts', async () => {
    const secret = await webhookSecret('x'.repeat(32));
    expect(secret).toMatch(/^[0-9a-f]{64}$/);
    expect(await webhookSecret('y'.repeat(32))).not.toBe(secret);
  });
});
