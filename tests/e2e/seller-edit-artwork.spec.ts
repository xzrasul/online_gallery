import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, sellerApplications, categories, techniques, artworks } from '../../src/db/schema';
import { createArtwork } from '../../src/lib/artworks/seller-operations';

test('a seller edits a published artwork and it goes back to pending', async ({ page }) => {
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
    displayName: `E2E edit студия ${Date.now()}`,
    bio: 'Био.',
    status: 'approved',
  });

  const categoryName = `E2E категория редактирования ${Date.now()}`;
  const techniqueName = `E2E техника редактирования ${Date.now()}`;
  const [category] = await getDb().insert(categories).values({ name: categoryName }).returning();
  const [technique] = await getDb().insert(techniques).values({ name: techniqueName }).returning();

  const artworkId = await createArtwork(getDb(), {
    sellerId: seller.id,
    title: 'Картина до редактирования',
    description: 'Старое описание.',
    price: 500,
    heightCm: 20,
    widthCm: 20,
    categoryId: category.id,
    techniqueId: technique.id,
    imageUrl: 'https://example.com/before.png',
  });
  await getDb().update(artworks).set({ status: 'published' }).where(eq(artworks.id, artworkId));

  try {
    const newTitle = `Картина после редактирования ${Date.now()}`;
    await page.goto(`/dashboard/seller/${artworkId}/edit`);
    await page.getByLabel('Название').fill(newTitle);
    await page.getByRole('button', { name: 'Сохранить и отправить на модерацию' }).click();

    await expect(page).toHaveURL(/\/dashboard\/seller$/, { timeout: 15000 });
    await expect(page.getByText(newTitle)).toBeVisible();
    await expect(page.getByText('На модерации')).toBeVisible();

    const [row] = await getDb().select().from(artworks).where(eq(artworks.id, artworkId));
    expect(row.status).toBe('pending');
    expect(row.title).toBe(newTitle);
  } finally {
    await getDb().delete(artworks).where(eq(artworks.sellerId, seller.id));
    await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, seller.id));
    await getDb().delete(categories).where(eq(categories.id, category.id));
    await getDb().delete(techniques).where(eq(techniques.id, technique.id));
    await getDb().delete(users).where(eq(users.id, seller.id));
  }
});
