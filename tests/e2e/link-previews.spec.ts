import { test, expect } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, sellerApplications, categories, techniques, artworks } from '../../src/db/schema';
import { createArtwork } from '../../src/lib/artworks/seller-operations';
import { testTelegramId } from '../helpers/test-telegram-id';

test('an artwork page carries its own link preview and is listed in the sitemap', async ({ page, request }) => {
  const [seller] = await getDb()
    .insert(users)
    .values({ telegramId: testTelegramId(`preview_seller_${Date.now()}`), fullName: 'Preview Seller', role: 'seller' })
    .returning();
  const artist = `Превью-студия ${Date.now()}`;
  await getDb().insert(sellerApplications).values({ userId: seller.id, displayName: artist, bio: 'Био.', status: 'approved' });
  const [category] = await getDb().insert(categories).values({ name: `Превью категория ${Date.now()}` }).returning();
  const [technique] = await getDb().insert(techniques).values({ name: `Превью техника ${Date.now()}` }).returning();
  const title = `Превью картина ${Date.now()}`;
  const imageUrl = 'https://example.com/preview.webp';
  const artworkId = await createArtwork(getDb(), {
    sellerId: seller.id,
    title,
    description: 'Горы Памира на рассвете.',
    price: 2400,
    heightCm: 50,
    widthCm: 70,
    categoryId: category.id,
    techniqueId: technique.id,
    imageUrl,
  });
  await getDb().update(artworks).set({ status: 'published' }).where(eq(artworks.id, artworkId));

  try {
    await page.goto(`/gallery/artwork/${artworkId}`);
    const og = (property: string) => page.locator(`meta[property="${property}"]`);
    await expect(og('og:title')).toHaveAttribute('content', `${title} — ${artist}`);
    await expect(og('og:description')).toHaveAttribute('content', new RegExp(`^2400 TJS · 50×70 см · ${technique.name}\\. Горы Памира`));
    await expect(og('og:image')).toHaveAttribute('content', imageUrl);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');

    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain(`/gallery/artwork/${artworkId}</loc>`);
    expect(sitemap).toContain(`/gallery/artist/${seller.id}</loc>`);
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /dashboard');
  } finally {
    await getDb().delete(artworks).where(eq(artworks.sellerId, seller.id));
    await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, seller.id));
    await getDb().delete(users).where(eq(users.id, seller.id));
    await getDb().delete(categories).where(eq(categories.id, category.id));
    await getDb().delete(techniques).where(eq(techniques.id, technique.id));
  }
});
