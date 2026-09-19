import { test, expect } from '@playwright/test';
import { signUpWithEmail } from './helpers/clerk';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

test('signing up as a seller lands on the pending status page', async ({ page }) => {
  await setupClerkTestingToken({ page });

  const testEmail = `seller+clerk_test_${Date.now()}@example.com`;
  const testPassword = `Xk9#mQ2vLp${Date.now()}!`;

  await signUpWithEmail(page, testEmail, testPassword);

  await expect(page).toHaveURL(/\/choose-role/, { timeout: 15000 });
  await page.getByRole('button', { name: 'Хочу продавать картины' }).click();

  await expect(page).toHaveURL(/\/become-seller$/, { timeout: 15000 });
  await page.getByLabel('Имя художника/студии').fill('Тестовая студия');
  await page.getByLabel('О себе').fill('Пишу пейзажи.');
  await page.getByRole('button', { name: 'Отправить на рассмотрение' }).click();

  await expect(page).toHaveURL(/\/become-seller\/status/, { timeout: 15000 });
  await expect(page.getByText('на рассмотрении')).toBeVisible();
});
