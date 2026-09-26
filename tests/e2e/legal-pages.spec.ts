import { test, expect } from '@playwright/test';

const DOCS = [
  { href: '/terms', title: 'Пользовательское соглашение' },
  { href: '/privacy', title: 'Политика конфиденциальности' },
  { href: '/rules/sellers', title: 'Правила для продавцов' },
  { href: '/contacts', title: 'Контакты и жалобы' },
];

test('every legal document opens and is linked from the footer', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  for (const doc of DOCS) {
    await expect(footer.getByRole('link', { name: doc.title })).toHaveAttribute('href', doc.href);
  }
  for (const doc of DOCS) {
    await page.goto(doc.href);
    await expect(page.getByRole('heading', { level: 1, name: doc.title })).toBeVisible();
  }
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test('the documents (tables included) have no horizontal scroll', async ({ page }) => {
    for (const doc of DOCS) {
      await page.goto(doc.href);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, doc.href).toBe(0);
    }
  });
});

test('the sign-in page links the terms and the privacy policy next to the button', async ({ page }) => {
  await page.goto('/sign-in');
  const login = page.locator('.login');
  await expect(login.getByRole('link', { name: 'Пользовательское соглашение' })).toHaveAttribute('href', '/terms');
  await expect(login.getByRole('link', { name: 'Политике конфиденциальности' })).toHaveAttribute('href', '/privacy');
});
