import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, categories, techniques, artworks } from '../../src/db/schema';
import { testTelegramId } from '../helpers/test-telegram-id';

describe('artworks schema', () => {
  const testUserKey = 'test_artworks_schema';
  const categoryName = 'Тест-категория схемы';
  const techniqueName = 'Тест-техника схемы';

  afterEach(async () => {
    await getDb().delete(artworks).where(eq(artworks.title, 'Тестовая картина схемы'));
    await getDb().delete(categories).where(eq(categories.name, categoryName));
    await getDb().delete(techniques).where(eq(techniques.name, techniqueName));
    await getDb().delete(users).where(eq(users.telegramId, testTelegramId(testUserKey)));
  });

  it('inserts an artwork with defaults and enforces FKs', async () => {
    const [seller] = await getDb()
      .insert(users)
      .values({ telegramId: testTelegramId(testUserKey), fullName: 'Schema Test', role: 'seller' })
      .returning();
    const [category] = await getDb().insert(categories).values({ name: categoryName }).returning();
    const [technique] = await getDb().insert(techniques).values({ name: techniqueName }).returning();

    await getDb().insert(artworks).values({
      sellerId: seller.id,
      title: 'Тестовая картина схемы',
      description: 'Описание для теста схемы.',
      price: 500,
      heightCm: 40,
      widthCm: 30,
      categoryId: category.id,
      techniqueId: technique.id,
      imageUrl: 'https://example.com/test.png',
    });

    const [row] = await getDb().select().from(artworks).where(eq(artworks.title, 'Тестовая картина схемы'));
    expect(row.status).toBe('pending');
    expect(row.price).toBe(500);
    expect(row.rejectionReason).toBeNull();
  });
});
