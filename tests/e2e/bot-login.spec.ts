import { test, expect } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { loginRequests, users } from '../../src/db/schema';
import { hashLoginToken, webhookSecret } from '../../src/lib/auth/bot-login';
import { getSessionSecret } from '../../src/lib/auth/session-token';
import { testTelegramId } from '../helpers/test-telegram-id';

// Simulates what Telegram sends to the webhook. Replies the webhook makes to the
// real Bot API fail for these fake chats, which must not break the login.
test('signing in through the bot: /start, confirm, and the page logs in by itself', async ({ page, request }) => {
  const telegramId = testTelegramId(`bot_login_e2e_${Date.now()}`);
  const from = { id: telegramId, is_bot: false, first_name: 'Бот', last_name: 'Вход', username: 'bot_login_e2e' };
  const headers = { 'x-telegram-bot-api-secret-token': await webhookSecret(getSessionSecret()) };

  await page.goto('/sign-in');
  await page.getByRole('button', { name: 'Войти через Telegram' }).click();
  const botLink = page.getByRole('link', { name: /Открыть @/ });
  await expect(botLink).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Ждём подтверждения');

  const token = new URL((await botLink.getAttribute('href'))!).searchParams.get('start')!;
  const [loginRequest] = await getDb()
    .select()
    .from(loginRequests)
    .where(eq(loginRequests.tokenHash, await hashLoginToken(token)));

  const start = await request.post('/api/telegram/webhook', {
    headers,
    data: { message: { chat: { id: telegramId, type: 'private' }, from, text: `/start ${token}` } },
  });
  expect(start.status()).toBe(200);

  const confirm = await request.post('/api/telegram/webhook', {
    headers,
    data: { callback_query: { id: 'cb1', from, data: `login:${loginRequest.id}` } },
  });
  expect(confirm.status()).toBe(200);

  await expect(page).toHaveURL(/\/choose-role/, { timeout: 15000 });
  const [user] = await getDb().select().from(users).where(eq(users.telegramId, telegramId));
  expect(user.fullName).toBe('Бот Вход');
  expect(user.username).toBe('bot_login_e2e');
});

test('the webhook rejects calls without the secret header', async ({ request }) => {
  const res = await request.post('/api/telegram/webhook', { data: { message: { text: '/start' } } });
  expect(res.status()).toBe(403);
});
