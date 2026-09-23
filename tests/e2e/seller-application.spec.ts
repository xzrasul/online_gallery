import { test, expect } from '@playwright/test';
import { signInAsNewUser } from './helpers/auth';

test('a new user applying as a seller lands on the pending status page', async ({ page }) => {
  await signInAsNewUser(page, 'seller_application');
  await page.getByRole('button', { name: 'Хочу продавать картины' }).click();

  await expect(page).toHaveURL(/\/become-seller$/, { timeout: 15000 });
  await page.getByLabel('Имя художника/студии').fill('Тестовая студия');
  await page.getByLabel('О себе').fill('Пишу пейзажи.');
  await page.getByRole('button', { name: 'Отправить на рассмотрение' }).click();

  await expect(page).toHaveURL(/\/become-seller\/status/, { timeout: 15000 });
  await expect(page.getByText('на рассмотрении')).toBeVisible();
});
