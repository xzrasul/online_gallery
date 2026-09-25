import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, categories, techniques, artworks, sellerApplications, homeCollage } from '../../src/db/schema';
import { clearCollageSlot, loadCollagePicks, setCollageSlot } from '../../src/lib/home/collage';
import { testTelegramId } from '../helpers/test-telegram-id';

// The tests share the site's database: the admin's real picks are put back afterwards.
describe('home collage picks', () => {
  let saved: (typeof homeCollage.$inferSelect)[] = [];
  let sellerId: string;
  let categoryId: string;
  let techniqueId: string;
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    saved = await getDb().select().from(homeCollage);
    await getDb().delete(homeCollage);

    const [seller] = await getDb()
      .insert(users)
      .values({ telegramId: testTelegramId('test_home_collage_seller'), fullName: 'Collage Test Seller', role: 'seller' })
      .returning();
    sellerId = seller.id;
    await getDb().insert(sellerApplications).values({
      userId: seller.id,
      displayName: 'Коллаж-тест студия',
      bio: 'Био.',
      telegramContact: '@collage_test',
      status: 'approved',
    });
    const [category] = await getDb().insert(categories).values({ name: 'Категория теста коллажа' }).returning();
    const [technique] = await getDb().insert(techniques).values({ name: 'Техника теста коллажа' }).returning();
    categoryId = category.id;
    techniqueId = technique.id;

    for (const [key, status] of [
      ['one', 'published'],
      ['two', 'published'],
      ['sold', 'sold'],
      ['pending', 'pending'],
    ] as const) {
      const [row] = await getDb()
        .insert(artworks)
        .values({
          sellerId,
          title: `Коллаж ${key}`,
          description: 'Описание.',
          price: 1000,
          heightCm: 30,
          widthCm: 40,
          categoryId,
          techniqueId,
          imageUrl: `https://example.com/${key}.png`,
          status,
        })
        .returning();
      ids[key] = row.id;
    }
  });

  afterAll(async () => {
    await getDb().delete(homeCollage);
    if (sellerId) {
      await getDb().delete(artworks).where(eq(artworks.sellerId, sellerId));
      await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, sellerId));
      await getDb().delete(users).where(eq(users.id, sellerId));
    }
    if (categoryId) await getDb().delete(categories).where(eq(categories.id, categoryId));
    if (techniqueId) await getDb().delete(techniques).where(eq(techniques.id, techniqueId));
    if (saved.length) await getDb().insert(homeCollage).values(saved);
  });

  it('puts a work in a slot, moves it between slots and clears a slot', async () => {
    expect(await setCollageSlot(getDb(), 'a', ids.one)).toBe(true);
    expect(await setCollageSlot(getDb(), 'b', ids.sold)).toBe(true);
    let picks = await loadCollagePicks(getDb());
    expect(picks.a).toMatchObject({ id: ids.one, title: 'Коллаж one', imageUrl: 'https://example.com/one.png' });
    expect(picks.b?.id).toBe(ids.sold);

    // the same work in another slot leaves its old one
    expect(await setCollageSlot(getDb(), 'c', ids.one)).toBe(true);
    picks = await loadCollagePicks(getDb());
    expect(picks.a).toBeUndefined();
    expect(picks.c?.id).toBe(ids.one);

    // a new pick replaces the slot's old one
    expect(await setCollageSlot(getDb(), 'c', ids.two)).toBe(true);
    expect((await loadCollagePicks(getDb())).c?.id).toBe(ids.two);

    await clearCollageSlot(getDb(), 'c');
    expect((await loadCollagePicks(getDb())).c).toBeUndefined();
  });

  it('refuses works that are not on sale and hides picks that were taken off', async () => {
    expect(await setCollageSlot(getDb(), 'a', ids.pending)).toBe(false);
    expect((await loadCollagePicks(getDb())).a).toBeUndefined();

    expect(await setCollageSlot(getDb(), 'a', ids.two)).toBe(true);
    await getDb().update(artworks).set({ status: 'rejected' }).where(eq(artworks.id, ids.two));
    expect((await loadCollagePicks(getDb())).a).toBeUndefined();
  });
});
