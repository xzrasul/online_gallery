import { test, expect } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, sellerApplications, categories, techniques, artworks } from '../../src/db/schema';
import { createArtwork } from '../../src/lib/artworks/seller-operations';

test('the home page greets visitors and shows the newest published artwork', async ({ page }) => {
  const [seller] = await getDb()
    .insert(users)
    .values({
      clerkUserId: `test_home_seller_${Date.now()}`,
      email: `home-test-${Date.now()}@example.com`,
      fullName: 'Home Test Seller',
      role: 'seller',
    })
    .returning();
  await getDb().insert(sellerApplications).values({
    userId: seller.id,
    displayName: `Главная-тест студия ${Date.now()}`,
    bio: 'Био.',
    status: 'approved',
  });
  const [category] = await getDb().insert(categories).values({ name: `Главная категория ${Date.now()}` }).returning();
  const [technique] = await getDb().insert(techniques).values({ name: `Главная техника ${Date.now()}` }).returning();
  const artworkTitle = `Главная картина ${Date.now()}`;
  const artworkId = await createArtwork(getDb(), {
    sellerId: seller.id,
    title: artworkTitle,
    description: 'Описание.',
    price: 1300,
    heightCm: 40,
    widthCm: 50,
    categoryId: category.id,
    techniqueId: technique.id,
    imageUrl: 'https://example.com/home.png',
  });
  await getDb().update(artworks).set({ status: 'published' }).where(eq(artworks.id, artworkId));

  try {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Галерея художников' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'В каталог' })).toHaveAttribute('href', '/gallery');
    await expect(page.getByRole('link', { name: 'Хочу продавать картины' })).toHaveAttribute('href', '/sign-up');
    await expect(page.getByText(artworkTitle)).toBeVisible();
  } finally {
    await getDb().delete(artworks).where(eq(artworks.id, artworkId));
    await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, seller.id));
    await getDb().delete(users).where(eq(users.id, seller.id));
    await getDb().delete(categories).where(eq(categories.id, category.id));
    await getDb().delete(techniques).where(eq(techniques.id, technique.id));
  }
});
