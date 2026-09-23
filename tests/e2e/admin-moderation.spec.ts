import { test, expect } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users } from '../../src/db/schema';
import { signInAsNewUser, signOut } from './helpers/auth';

test('admin approves a pending seller application', async ({ page }) => {
  // Sign in the future seller and submit an application.
  const displayName = `Админ-тест студия ${Date.now()}`;
  await signInAsNewUser(page, 'moderation_seller');

  await page.getByRole('button', { name: 'Хочу продавать картины' }).click();
  await expect(page).toHaveURL(/\/become-seller$/, { timeout: 15000 });

  await page.getByLabel('Имя художника/студии').fill(displayName);
  await page.getByLabel('О себе').fill('Тест.');
  await page.getByRole('button', { name: 'Отправить на рассмотрение' }).click();
  await expect(page).toHaveURL(/\/become-seller\/status/, { timeout: 15000 });

  await signOut(page);

  // Sign in a second account and promote it to admin directly in the DB.
  const adminUser = await signInAsNewUser(page, 'moderation_admin');
  await getDb().update(users).set({ role: 'admin' }).where(eq(users.id, adminUser.id));

  await page.goto('/admin/sellers');
  await expect(page.getByText(displayName)).toBeVisible();
  await page
    .locator('section', { hasText: displayName })
    .getByRole('button', { name: 'Одобрить' })
    .click();
  await expect(page.getByText(displayName)).not.toBeVisible();
});
