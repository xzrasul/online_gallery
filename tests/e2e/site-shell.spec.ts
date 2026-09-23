import { test, expect } from '@playwright/test';

test('guests see the shell with catalog and auth links', async ({ page }) => {
  await page.goto('/');
  const header = page.getByRole('banner');
  await expect(header.getByRole('link', { name: 'SanatPlace' })).toBeVisible();
  await expect(header.getByRole('link', { name: 'Каталог' })).toBeVisible();
  await expect(header.getByRole('link', { name: 'Каталог' })).toHaveAttribute('href', '/gallery');
  await expect(header.getByRole('link', { name: 'Войти через Telegram' })).toHaveAttribute('href', '/sign-in');
});

test('the header stays pinned to the top while scrolling', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.style.height = '3000px';
    document.body.appendChild(spacer);
    window.scrollTo(0, 1000);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(1000);
  const box = await page.getByRole('banner').boundingBox();
  expect(box?.y).toBe(0);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test('the menu button opens a navigation sheet', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Каталог' })).toBeHidden();
    await page.getByRole('button', { name: 'Меню' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('link', { name: 'Каталог' })).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Войти через Telegram' })).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Войти через Telegram' })).toHaveAttribute('href', '/sign-in');
    await dialog.getByRole('link', { name: 'Каталог' }).click();
    await expect(page).toHaveURL(/\/gallery$/);
  });
});
