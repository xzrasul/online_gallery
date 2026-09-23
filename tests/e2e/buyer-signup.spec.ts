import { test, expect } from '@playwright/test';
import { testTelegramId } from '../helpers/test-telegram-id';

test('first sign-in from the sign-in page leads to the role-choice screen', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page.getByRole('heading', { name: 'Вход в SanatPlace' })).toBeVisible();

  const devLogin = page.getByRole('form', { name: 'Вход для разработки' });
  await devLogin.getByLabel('Telegram ID').fill(String(testTelegramId(`buyer_signup_${Date.now()}`)));
  await devLogin.getByLabel('Имя').fill('Покупатель Тест');
  await devLogin.getByRole('button', { name: 'Войти как тестовый пользователь' }).click();

  await expect(page).toHaveURL(/\/choose-role/, { timeout: 15000 });
  await expect(page.getByRole('heading')).toContainText('Как вы хотите');
});

test('a signed-in user can sign out from the header', async ({ page }) => {
  await page.goto(`/auth/dev-login?id=${testTelegramId(`sign_out_${Date.now()}`)}`);
  await expect(page).toHaveURL(/\/choose-role/, { timeout: 15000 });

  const header = page.getByRole('banner');
  await header.getByRole('button', { name: 'Выйти' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(header.getByRole('link', { name: 'Войти через Telegram' })).toBeVisible();

  await page.goto('/dashboard/buyer');
  await expect(page).toHaveURL(/\/sign-in/);
});
