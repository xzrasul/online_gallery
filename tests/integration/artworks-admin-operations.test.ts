import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, categories, techniques, artworks, sellerApplications } from '../../src/db/schema';
import { approveOrRejectArtwork, listPendingArtworks } from '../../src/lib/artworks/admin-operations';
import { testTelegramId } from '../helpers/test-telegram-id';

describe('admin artwork operations', () => {
  const userKeys = new Set<string>();
  let categoryId: string;
  let techniqueId: string;

  afterEach(async () => {
    for (const id of userKeys) {
      const [user] = await getDb().select().from(users).where(eq(users.telegramId, testTelegramId(id)));
      if (user) {
        await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, user.id));
        await getDb().delete(artworks).where(eq(artworks.sellerId, user.id));
        await getDb().delete(users).where(eq(users.id, user.id));
      }
    }
    userKeys.clear();
    if (categoryId) await getDb().delete(categories).where(eq(categories.id, categoryId));
    if (techniqueId) await getDb().delete(techniques).where(eq(techniques.id, techniqueId));
  });

  async function setup() {
    const sellerUserKey = 'test_admin_ops_seller';
    const adminUserKey = 'test_admin_ops_admin';
    userKeys.add(sellerUserKey);
    userKeys.add(adminUserKey);

    const [seller] = await getDb()
      .insert(users)
      .values({ telegramId: testTelegramId(sellerUserKey), fullName: 'Seller', role: 'seller' })
      .returning();
    const [admin] = await getDb()
      .insert(users)
      .values({ telegramId: testTelegramId(adminUserKey), fullName: 'Admin', role: 'admin' })
      .returning();
    await getDb().insert(sellerApplications).values({
      userId: seller.id,
      displayName: 'Мастерская теста',
      bio: 'Био.',
      status: 'approved',
    });
    const [category] = await getDb().insert(categories).values({ name: 'Категория admin-ops теста' }).returning();
    const [technique] = await getDb().insert(techniques).values({ name: 'Техника admin-ops теста' }).returning();
    categoryId = category.id;
    techniqueId = technique.id;

    const [artwork] = await getDb()
      .insert(artworks)
      .values({
        sellerId: seller.id,
        title: 'Картина на модерации',
        description: 'Описание.',
        price: 400,
        heightCm: 20,
        widthCm: 20,
        categoryId: category.id,
        techniqueId: technique.id,
        imageUrl: 'https://example.com/pending.png',
      })
      .returning();

    return { seller, admin, artwork };
  }

  it('lists pending artworks joined with names', async () => {
    const { artwork } = await setup();

    const pending = await listPendingArtworks(getDb());
    const found = pending.find((a) => a.id === artwork.id);
    expect(found).toBeDefined();
    expect(found?.categoryName).toBe('Категория admin-ops теста');
    expect(found?.techniqueName).toBe('Техника admin-ops теста');
    expect(found?.sellerDisplayName).toBe('Мастерская теста');
  });

  it('approving publishes the artwork', async () => {
    const { admin, artwork } = await setup();

    await approveOrRejectArtwork(getDb(), {
      artworkId: artwork.id,
      adminUserId: admin.id,
      decision: 'approve',
    });

    const [row] = await getDb().select().from(artworks).where(eq(artworks.id, artwork.id));
    expect(row.status).toBe('published');
    expect(row.reviewedByAdminId).toBe(admin.id);
  });

  it('rejecting stores the reason', async () => {
    const { admin, artwork } = await setup();

    await approveOrRejectArtwork(getDb(), {
      artworkId: artwork.id,
      adminUserId: admin.id,
      decision: 'reject',
      reason: 'Размытое фото',
    });

    const [row] = await getDb().select().from(artworks).where(eq(artworks.id, artwork.id));
    expect(row.status).toBe('rejected');
    expect(row.rejectionReason).toBe('Размытое фото');
  });
});
