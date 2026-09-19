import { test, expect } from '@playwright/test';
import { signUpWithEmail } from './helpers/clerk';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, sellerApplications, categories, techniques, artworks } from '../../src/db/schema';
import { createArtwork } from '../../src/lib/artworks/seller-operations';

test('admin approves a pending artwork', async ({ page }) => {
  await setupClerkTestingToken({ page });

  const sellerClerkEmail = `seller+clerk_test_${Date.now()}@example.com`;
  const [seller] = await getDb()
    .insert(users)
    .values({
      clerkUserId: `test_artwork_mod_seller_${Date.now()}`,
      email: sellerClerkEmail,
      fullName: 'Seller',
      role: 'seller',
    })
    .returning();
  await getDb().insert(sellerApplications).values({
    userId: seller.id,
    displayName: `Худ. модерация теста ${Date.now()}`,
    bio: 'Био.',
    status: 'approved',
  });
  const [category] = await getDb().insert(categories).values({ name: `Категория модерации ${Date.now()}` }).returning();
  const [technique] = await getDb().insert(techniques).values({ name: `Техника модерации ${Date.now()}` }).returning();

  const artworkTitle = `Картина для одобрения ${Date.now()}`;
  const artworkId = await createArtwork(getDb(), {
    sellerId: seller.id,
    title: artworkTitle,
    description: 'Описание.',
    price: 900,
    heightCm: 25,
    widthCm: 35,
    categoryId: category.id,
    techniqueId: technique.id,
    imageUrl: 'https://example.com/pending-e2e.png',
  });

  const adminEmail = `admin+clerk_test_${Date.now()}@example.com`;
  const adminPassword = `Zt7#nQ4wRp${Date.now()}!`;

  let adminUserId: string | undefined;
  try {
    await signUpWithEmail(page, adminEmail, adminPassword);
    await expect(page).toHaveURL(/\/choose-role/, { timeout: 15000 });

    const [adminUser] = await getDb().select().from(users).where(eq(users.email, adminEmail));
    adminUserId = adminUser.id;
    await getDb().update(users).set({ role: 'admin' }).where(eq(users.id, adminUser.id));

    await page.goto('/admin/artworks');
    await expect(page.getByText(artworkTitle)).toBeVisible();
    await page
      .locator('section', { hasText: artworkTitle })
      .getByRole('button', { name: 'Одобрить' })
      .click();
    await expect(page.getByText(artworkTitle)).not.toBeVisible();

    const [row] = await getDb().select().from(artworks).where(eq(artworks.id, artworkId));
    expect(row.status).toBe('published');
  } finally {
    await getDb().delete(artworks).where(eq(artworks.id, artworkId));
    await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, seller.id));
    await getDb().delete(users).where(eq(users.id, seller.id));
    if (adminUserId) await getDb().delete(users).where(eq(users.id, adminUserId));
    await getDb().delete(categories).where(eq(categories.id, category.id));
    await getDb().delete(techniques).where(eq(techniques.id, technique.id));
  }
});
