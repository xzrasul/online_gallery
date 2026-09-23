import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, categories, techniques, artworks } from '../../src/db/schema';
import {
  createArtwork,
  updateArtwork,
  markArtworkAsSold,
  listArtworksForSeller,
  getArtworkForOwner,
} from '../../src/lib/artworks/seller-operations';
import { testTelegramId } from '../helpers/test-telegram-id';

async function setupSellerAndRefs(
  userKey: string,
  createdCategoryIds: string[],
  createdTechniqueIds: string[],
) {
  const [seller] = await getDb()
    .insert(users)
    .values({ telegramId: testTelegramId(userKey), fullName: 'Seller Ops Test', role: 'seller' })
    .returning();
  const [category] = await getDb().insert(categories).values({ name: `Категория ${userKey}` }).returning();
  const [technique] = await getDb().insert(techniques).values({ name: `Техника ${userKey}` }).returning();
  createdCategoryIds.push(category.id);
  createdTechniqueIds.push(technique.id);
  return { seller, category, technique };
}

describe('seller artwork operations', () => {
  const userKeys = new Set<string>();
  const createdCategoryIds: string[] = [];
  const createdTechniqueIds: string[] = [];

  afterEach(async () => {
    for (const id of userKeys) {
      const [user] = await getDb().select().from(users).where(eq(users.telegramId, testTelegramId(id)));
      if (user) {
        await getDb().delete(artworks).where(eq(artworks.sellerId, user.id));
        await getDb().delete(users).where(eq(users.id, user.id));
      }
    }
    userKeys.clear();
    for (const id of createdCategoryIds) {
      await getDb().delete(categories).where(eq(categories.id, id));
    }
    for (const id of createdTechniqueIds) {
      await getDb().delete(techniques).where(eq(techniques.id, id));
    }
    createdCategoryIds.length = 0;
    createdTechniqueIds.length = 0;
  });

  it('creates an artwork with status pending', async () => {
    const userKey = 'test_seller_ops_create';
    userKeys.add(userKey);
    const { seller, category, technique } = await setupSellerAndRefs(userKey, createdCategoryIds, createdTechniqueIds);

    const id = await createArtwork(getDb(), {
      sellerId: seller.id,
      title: 'Закат над рекой',
      description: 'Пейзаж маслом.',
      price: 1200,
      heightCm: 50,
      widthCm: 70,
      categoryId: category.id,
      techniqueId: technique.id,
      imageUrl: 'https://example.com/a.png',
    });

    const [row] = await getDb().select().from(artworks).where(eq(artworks.id, id));
    expect(row.status).toBe('pending');
  });

  it('updating an already-published artwork resets it to pending', async () => {
    const userKey = 'test_seller_ops_update';
    userKeys.add(userKey);
    const { seller, category, technique } = await setupSellerAndRefs(userKey, createdCategoryIds, createdTechniqueIds);

    const id = await createArtwork(getDb(), {
      sellerId: seller.id,
      title: 'Горы',
      description: 'Пейзаж.',
      price: 800,
      heightCm: 40,
      widthCm: 40,
      categoryId: category.id,
      techniqueId: technique.id,
      imageUrl: 'https://example.com/b.png',
    });
    await getDb()
      .update(artworks)
      .set({ status: 'published', reviewedAt: new Date() })
      .where(eq(artworks.id, id));

    await updateArtwork(getDb(), {
      artworkId: id,
      sellerId: seller.id,
      title: 'Горы (новая версия)',
      description: 'Обновлённое описание.',
      price: 900,
      heightCm: 40,
      widthCm: 40,
      categoryId: category.id,
      techniqueId: technique.id,
      imageUrl: 'https://example.com/b2.png',
    });

    const [row] = await getDb().select().from(artworks).where(eq(artworks.id, id));
    expect(row.status).toBe('pending');
    expect(row.title).toBe('Горы (новая версия)');
    expect(row.rejectionReason).toBeNull();
    expect(row.reviewedAt).toBeNull();
  });

  it('marks a published artwork as sold, and rejects a non-published one', async () => {
    const userKey = 'test_seller_ops_sold';
    userKeys.add(userKey);
    const { seller, category, technique } = await setupSellerAndRefs(userKey, createdCategoryIds, createdTechniqueIds);

    const id = await createArtwork(getDb(), {
      sellerId: seller.id,
      title: 'Натюрморт',
      description: 'Описание.',
      price: 300,
      heightCm: 20,
      widthCm: 30,
      categoryId: category.id,
      techniqueId: technique.id,
      imageUrl: 'https://example.com/c.png',
    });

    await expect(markArtworkAsSold(getDb(), { artworkId: id, sellerId: seller.id })).rejects.toThrow();

    await getDb().update(artworks).set({ status: 'published' }).where(eq(artworks.id, id));
    await markArtworkAsSold(getDb(), { artworkId: id, sellerId: seller.id });

    const [row] = await getDb().select().from(artworks).where(eq(artworks.id, id));
    expect(row.status).toBe('sold');
  });

  it('lists all artworks for a seller and fetches one by owner', async () => {
    const userKey = 'test_seller_ops_list';
    userKeys.add(userKey);
    const { seller, category, technique } = await setupSellerAndRefs(userKey, createdCategoryIds, createdTechniqueIds);

    const id = await createArtwork(getDb(), {
      sellerId: seller.id,
      title: 'Портрет',
      description: 'Описание.',
      price: 600,
      heightCm: 30,
      widthCm: 25,
      categoryId: category.id,
      techniqueId: technique.id,
      imageUrl: 'https://example.com/d.png',
    });

    const list = await listArtworksForSeller(getDb(), seller.id);
    expect(list.some((a) => a.id === id)).toBe(true);

    const owned = await getArtworkForOwner(getDb(), { artworkId: id, sellerId: seller.id });
    expect(owned?.id).toBe(id);

    const notOwned = await getArtworkForOwner(getDb(), { artworkId: id, sellerId: '00000000-0000-0000-0000-000000000000' });
    expect(notOwned).toBeUndefined();
  });
});
