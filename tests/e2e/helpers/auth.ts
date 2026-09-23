import type { Page } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { getDb } from '../../../src/db';
import { users } from '../../../src/db/schema';
import { testTelegramId } from '../../helpers/test-telegram-id';

// Signs a brand-new user in through the development-only /auth/dev-login
// route (the real Telegram widget cannot run on localhost). New accounts are
// redirected to /choose-role, exactly like a first Telegram login.
export async function signInAsNewUser(page: Page, label = 'e2e_user') {
  const telegramId = testTelegramId(`${label}_${Date.now()}_${Math.random()}`);
  await page.goto(`/auth/dev-login?id=${telegramId}&name=${encodeURIComponent('E2E Тест')}`);
  await page.waitForURL(/\/choose-role/, { timeout: 15000 });
  const [user] = await getDb().select().from(users).where(eq(users.telegramId, telegramId));
  return user;
}

export async function signOut(page: Page) {
  await page.context().clearCookies();
}
