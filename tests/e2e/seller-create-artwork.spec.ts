import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, sellerApplications, categories, techniques, artworks } from '../../src/db/schema';

test('an approved seller creates an artwork', async ({ page }) => {
  await setupClerkTestingToken({ page });

  const sellerEmail = `seller+clerk_test_${Date.now()}@example.com`;
  const sellerPassword = `Xk9#mQ2vLp${Date.now()}!`;

  await page.goto('/sign-up');
  await page.getByLabel('Email address').fill(sellerEmail);
  await page.getByLabel('Password', { exact: true }).fill(sellerPassword);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Enter verification code').fill('424242');
  await expect(page).toHaveURL(/\/choose-role/, { timeout: 15000 });

  const [seller] = await getDb().select().from(users).where(eq(users.email, sellerEmail));
  await getDb().update(users).set({ role: 'seller' }).where(eq(users.id, seller.id));
  await getDb().insert(sellerApplications).values({
    userId: seller.id,
    displayName: `E2E студия ${Date.now()}`,
    bio: 'Био.',
    status: 'approved',
  });

  const categoryName = `E2E категория создания ${Date.now()}`;
  const techniqueName = `E2E техника создания ${Date.now()}`;
  const [category] = await getDb().insert(categories).values({ name: categoryName }).returning();
  const [technique] = await getDb().insert(techniques).values({ name: techniqueName }).returning();

  const artworkTitle = `E2E картина ${Date.now()}`;

  try {
    await page.goto('/dashboard/seller/new');
    await page.getByLabel('Название').fill(artworkTitle);
    await page.getByLabel('Описание').fill('Тестовое описание картины.');
    await page.getByLabel('Цена (сомони)').fill('750');
    await page.getByLabel('Высота (см)').fill('40');
    await page.getByLabel('Ширина (см)').fill('30');
    await page.getByLabel('Категория').selectOption({ label: categoryName });
    await page.getByLabel('Техника').selectOption({ label: techniqueName });
    await page.getByLabel('Фото').setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    });
    await page.getByRole('button', { name: 'Отправить на модерацию' }).click();

    await expect(page).toHaveURL(/\/dashboard\/seller$/, { timeout: 15000 });
    await expect(page.getByText(artworkTitle)).toBeVisible();
    await expect(page.getByText('На модерации')).toBeVisible();

    const [artwork] = await getDb().select().from(artworks).where(eq(artworks.title, artworkTitle));
    expect(artwork.status).toBe('pending');
  } finally {
    await getDb().delete(artworks).where(eq(artworks.sellerId, seller.id));
    await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, seller.id));
    await getDb().delete(categories).where(eq(categories.id, category.id));
    await getDb().delete(techniques).where(eq(techniques.id, technique.id));
    await getDb().delete(users).where(eq(users.id, seller.id));
  }
});
