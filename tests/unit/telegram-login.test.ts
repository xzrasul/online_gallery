import { createHash, createHmac } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { verifyTelegramLogin } from '../../src/lib/auth/telegram-login';

const BOT_TOKEN = '123456:TEST-bot-token';
const NOW = 1_800_000_000;

// Signs params exactly as Telegram documents it, independently of the code under test.
function sign(fields: Record<string, string>, token = BOT_TOKEN): Record<string, string> {
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('\n');
  const secret = createHash('sha256').update(token).digest();
  return { ...fields, hash: createHmac('sha256', secret).update(dataCheckString).digest('hex') };
}

const base = {
  id: '987654321',
  first_name: 'Иван',
  last_name: 'Петров',
  username: 'ivan_art',
  photo_url: 'https://t.me/i/userpic/320/ivan.jpg',
  auth_date: String(NOW - 60),
};

describe('verifyTelegramLogin', () => {
  it('accepts a correctly signed payload and maps the profile', async () => {
    expect(await verifyTelegramLogin(sign(base), BOT_TOKEN, NOW)).toEqual({
      telegramId: 987654321,
      fullName: 'Иван Петров',
      username: 'ivan_art',
      photoUrl: 'https://t.me/i/userpic/320/ivan.jpg',
    });
  });

  it('accepts a minimal payload without optional fields', async () => {
    const params = sign({ id: '42', first_name: 'Anna', auth_date: String(NOW) });
    expect(await verifyTelegramLogin(params, BOT_TOKEN, NOW)).toEqual({
      telegramId: 42,
      fullName: 'Anna',
      username: null,
      photoUrl: null,
    });
  });

  it('rejects a tampered field', async () => {
    const params = { ...sign(base), id: '1' };
    expect(await verifyTelegramLogin(params, BOT_TOKEN, NOW)).toBeNull();
  });

  it('rejects a payload signed with another bot token', async () => {
    expect(await verifyTelegramLogin(sign(base, '999:other'), BOT_TOKEN, NOW)).toBeNull();
  });

  it('rejects a login older than one day', async () => {
    const params = sign({ ...base, auth_date: String(NOW - 24 * 60 * 60 - 1) });
    expect(await verifyTelegramLogin(params, BOT_TOKEN, NOW)).toBeNull();
  });

  it('rejects a payload without hash', async () => {
    expect(await verifyTelegramLogin(base, BOT_TOKEN, NOW)).toBeNull();
  });
});
