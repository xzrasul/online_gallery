import { test, expect } from '@playwright/test';

test('guests see the shell with catalog and auth links', async ({ page }) => {
  await page.goto('/');
  const header = page.getByRole('banner');
  await expect(header.getByRole('link', { name: 'sanatplace' })).toBeVisible();
  await expect(header.getByRole('link', { name: 'Каталог' })).toBeVisible();
  await expect(header.getByRole('link', { name: 'Каталог' })).toHaveAttribute('href', '/gallery');
  await expect(header.getByRole('link', { name: 'Войти через Telegram' })).toHaveAttribute('href', '/sign-in');
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test('the header links stay visible and lead to the catalog', async ({ page }) => {
    await page.goto('/');
    const header = page.getByRole('banner');
    await expect(header.getByRole('link', { name: 'Войти через Telegram' })).toHaveAttribute('href', '/sign-in');
    await header.getByRole('link', { name: 'Каталог' }).click();
    await expect(page).toHaveURL(/\/gallery$/);
    await expect(header.getByRole('link', { name: 'Каталог' })).toHaveAttribute('aria-current', 'page');
  });

  test('the page has no horizontal scroll', async ({ page }) => {
    for (const path of ['/', '/gallery', '/sign-in']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBe(0);
    }
  });
});
