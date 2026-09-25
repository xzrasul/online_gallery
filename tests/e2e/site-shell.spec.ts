import { test, expect } from '@playwright/test';

test('guests see the header pill: logo, wishlist and sign-in', async ({ page }) => {
  await page.goto('/');
  const header = page.getByRole('banner');
  await expect(header.getByRole('link', { name: 'sanatplace' })).toBeVisible();
  await expect(header.getByRole('link', { name: /Wishlist/ })).toHaveAttribute('href', '/favorites');
  await expect(header.getByRole('link', { name: 'Войти через Telegram' })).toHaveAttribute('href', '/sign-in');
  // no link bar in the header: the site links live in the burger menu
  await expect(header.getByRole('link', { name: 'Каталог' })).toHaveCount(0);
});

test('the header search opens the catalog with the query', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('banner').getByRole('searchbox', { name: 'Поиск картин' }).fill('ночь');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/gallery\?q=/, { timeout: 15000 });
  await expect(page.getByRole('searchbox', { name: 'Поиск по каталогу' })).toHaveValue('ночь');
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test('the site links live in the burger menu at the bottom right', async ({ page }) => {
    await page.goto('/');
    const burger = page.getByRole('button', { name: 'Меню' });
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
    await burger.click();
    const menu = page.getByRole('navigation', { name: 'Меню' });
    await expect(menu.getByRole('link', { name: 'Войти через Telegram' })).toHaveAttribute('href', '/sign-in');
    await expect(menu.getByRole('link', { name: 'Главная' })).toHaveAttribute('aria-current', 'page');

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(burger).toBeFocused();

    await burger.click();
    await menu.getByRole('link', { name: 'Каталог' }).click();
    await expect(page).toHaveURL(/\/gallery$/, { timeout: 15000 });
    await expect(menu).toBeHidden();
    await page.getByRole('button', { name: 'Меню' }).click();
    await expect(menu.getByRole('link', { name: 'Каталог' })).toHaveAttribute('aria-current', 'page');
  });

  test('the page has no horizontal scroll', async ({ page }) => {
    for (const path of ['/', '/gallery', '/artists', '/sell', '/sign-in', '/gallery/artwork/mona-lisa', '/gallery/artist/van-gogh']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBe(0);
    }
  });
});
