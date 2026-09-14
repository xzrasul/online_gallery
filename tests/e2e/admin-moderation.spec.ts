import { test, expect } from '@playwright/test';
import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users } from '../../src/db/schema';

test('admin approves a pending seller application', async ({ page }) => {
  await setupClerkTestingToken({ page });

  // Sign up the future seller and submit an application.
  const sellerEmail = `seller+clerk_test_${Date.now()}@example.com`;
  const sellerPassword = `Xk9#mQ2vLp${Date.now()}!`;
  const displayName = `Админ-тест студия ${Date.now()}`;

  await page.goto('/sign-up');
  await page.getByLabel('Email address').fill(sellerEmail);
  await page.getByLabel('Password', { exact: true }).fill(sellerPassword);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  // Clerk's OTP field auto-submits once all 6 digits are entered.
  await page.getByLabel('Enter verification code').fill('424242');
  await expect(page).toHaveURL(/\/choose-role/, { timeout: 15000 });

  await page.getByRole('button', { name: 'Хочу продавать картины' }).click();
  await expect(page).toHaveURL(/\/become-seller$/, { timeout: 15000 });

  await page.getByLabel('Имя художника/студии').fill(displayName);
  await page.getByLabel('О себе').fill('Тест.');
  await page.getByRole('button', { name: 'Отправить на рассмотрение' }).click();
  await expect(page).toHaveURL(/\/become-seller\/status/, { timeout: 15000 });

  await clerk.signOut({ page });

  // Sign up a second account and promote it to admin directly in the DB.
  const adminEmail = `admin+clerk_test_${Date.now()}@example.com`;
  const adminPassword = `Zt7#nQ4wRp${Date.now()}!`;

  await page.goto('/sign-up');
  await page.getByLabel('Email address').fill(adminEmail);
  await page.getByLabel('Password', { exact: true }).fill(adminPassword);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await page.getByLabel('Enter verification code').fill('424242');
  await expect(page).toHaveURL(/\/choose-role/, { timeout: 15000 });

  const [adminUser] = await getDb().select().from(users).where(eq(users.email, adminEmail));
  await getDb().update(users).set({ role: 'admin' }).where(eq(users.id, adminUser.id));

  await page.goto('/admin/sellers');
  await expect(page.getByText(displayName)).toBeVisible();
  await page
    .locator('section', { hasText: displayName })
    .getByRole('button', { name: 'Одобрить' })
    .click();
  await expect(page.getByText(displayName)).not.toBeVisible();
});
