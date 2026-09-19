import { test, expect } from '@playwright/test';

test('guests see the shell with catalog and auth links', async ({ page }) => {
  await page.goto('/');
  const header = page.getByRole('banner');
  await expect(header.getByRole('link', { name: 'Галерея' })).toBeVisible();
  await expect(header.getByRole('link', { name: 'Каталог' })).toHaveAttribute('href', '/gallery');
  await expect(header.getByRole('link', { name: 'Войти' })).toHaveAttribute('href', '/sign-in');
  await expect(header.getByRole('link', { name: 'Регистрация' })).toHaveAttribute('href', '/sign-up');
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test('the menu button opens a navigation sheet', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Каталог' })).toBeHidden();
    await page.getByRole('button', { name: 'Меню' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('link', { name: 'Каталог' })).toBeVisible();
    await dialog.getByRole('link', { name: 'Каталог' }).click();
    await expect(page).toHaveURL(/\/gallery$/);
  });
});
