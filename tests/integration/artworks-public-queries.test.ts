import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, categories, techniques, artworks, sellerApplications } from '../../src/db/schema';
import {
  listPublishedArtworks,
  getPublishedArtworkById,
  getArtistPublicProfile,
} from '../../src/lib/artworks/public-queries';

describe('public gallery queries', () => {
  const clerkId = 'test_public_queries_seller';
  let categoryId: string;
  let techniqueId: string;
  let sellerId: string;
  let publishedId: string;
  let pendingId: string;

  afterEach(async () => {
    // Guarded: if a test fails before assigning these ids, eq(col, undefined)
    // would throw here and hide the real failure.
    if (sellerId) {
      await getDb().delete(artworks).where(eq(artworks.sellerId, sellerId));
      await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, sellerId));
      await getDb().delete(users).where(eq(users.id, sellerId));
    }
    if (categoryId) await getDb().delete(categories).where(eq(categories.id, categoryId));
    if (techniqueId) await getDb().delete(techniques).where(eq(techniques.id, techniqueId));
  });

  it('lists only published artworks, filters by category/price, and returns total', async () => {
    const [seller] = await getDb()
      .insert(users)
      .values({ clerkUserId: clerkId, email: `${clerkId}@example.com`, fullName: 'Public Test Seller', role: 'seller' })
      .returning();
    sellerId = seller.id;
    await getDb().insert(sellerApplications).values({
      userId: seller.id,
      displayName: 'Паблик-тест студия',
      bio: 'Био.',
      telegramContact: '@public_test',
      status: 'approved',
    });
    const [category] = await getDb().insert(categories).values({ name: 'Публичная категория теста' }).returning();
    const [technique] = await getDb().insert(techniques).values({ name: 'Публичная техника теста' }).returning();
    categoryId = category.id;
    techniqueId = technique.id;

    const [published] = await getDb()
      .insert(artworks)
      .values({
        sellerId: seller.id,
        title: 'Опубликованная картина',
        description: 'Описание.',
        price: 1000,
        heightCm: 30,
        widthCm: 40,
        categoryId: category.id,
        techniqueId: technique.id,
        imageUrl: 'https://example.com/pub.png',
        status: 'published',
      })
      .returning();
    publishedId = published.id;

    const [pending] = await getDb()
      .insert(artworks)
      .values({
        sellerId: seller.id,
        title: 'Картина на модерации',
        description: 'Описание.',
        price: 2000,
        heightCm: 30,
        widthCm: 40,
        categoryId: category.id,
        techniqueId: technique.id,
        imageUrl: 'https://example.com/pending.png',
      })
      .returning();
    pendingId = pending.id;

    const { items, total } = await listPublishedArtworks(
      getDb(),
      { categoryId: category.id },
      { page: 1, pageSize: 10 },
    );
    expect(items.some((a) => a.id === publishedId)).toBe(true);
    expect(items.some((a) => a.id === pendingId)).toBe(false);
    expect(total).toBeGreaterThanOrEqual(1);

    const priceFiltered = await listPublishedArtworks(
      getDb(),
      { minPrice: 5000 },
      { page: 1, pageSize: 10 },
    );
    expect(priceFiltered.items.some((a) => a.id === publishedId)).toBe(false);

    const detail = await getPublishedArtworkById(getDb(), publishedId);
    expect(detail?.title).toBe('Опубликованная картина');
    expect(detail?.categoryName).toBe('Публичная категория теста');
    expect(detail?.sellerTelegramContact).toBe('@public_test');

    const pendingDetail = await getPublishedArtworkById(getDb(), pendingId);
    expect(pendingDetail).toBeUndefined();

    const profile = await getArtistPublicProfile(getDb(), seller.id);
    expect(profile?.displayName).toBe('Паблик-тест студия');
    expect(profile?.telegramContact).toBe('@public_test');
    expect(profile?.artworks.some((a) => a.id === publishedId)).toBe(true);
    expect(profile?.artworks.some((a) => a.id === pendingId)).toBe(false);
  });
});
