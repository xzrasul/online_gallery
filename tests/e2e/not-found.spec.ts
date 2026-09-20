import { test, expect } from '@playwright/test';

test('an unknown URL shows the Russian 404 page inside the site shell', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Страница не найдена' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Перейти в каталог' })).toHaveAttribute('href', '/gallery');
  await expect(page.getByRole('banner')).toBeVisible();
});
