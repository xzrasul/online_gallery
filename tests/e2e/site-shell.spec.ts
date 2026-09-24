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

  test('the header links live in a burger menu', async ({ page }) => {
    await page.goto('/');
    const header = page.getByRole('banner');
    await expect(header.getByRole('link', { name: 'Каталог' })).toBeHidden();

    const burger = header.getByRole('button', { name: 'Меню' });
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
    await burger.click();
    const menu = header.getByRole('navigation', { name: 'Меню' });
    await expect(menu.getByRole('link', { name: 'Войти через Telegram' })).toHaveAttribute('href', '/sign-in');

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(burger).toBeFocused();

    await burger.click();
    await menu.getByRole('link', { name: 'Каталог' }).click();
    await expect(page).toHaveURL(/\/gallery$/, { timeout: 15000 });
    await expect(menu).toBeHidden();
    await header.getByRole('button', { name: 'Меню' }).click();
    await expect(menu.getByRole('link', { name: 'Каталог' })).toHaveAttribute('aria-current', 'page');
  });

  test('the page has no horizontal scroll', async ({ page }) => {
    for (const path of ['/', '/gallery', '/sign-in']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBe(0);
    }
  });
});
