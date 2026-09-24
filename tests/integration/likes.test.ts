import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq, inArray } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { artworkLikes, artworks, categories, sellerApplications, techniques, users } from '../../src/db/schema';
import { likeInfoFor, listFavorites, setLike } from '../../src/lib/likes/likes';
import { testTelegramId } from '../helpers/test-telegram-id';

const key = `likes_${Date.now()}`;
let artist: { id: string };
let fan: { id: string };
let other: { id: string };
let published: string;
let sold: string;
let pending: string;
let categoryId: string;
let techniqueId: string;

async function user(label: string, role: 'buyer' | 'seller' = 'buyer') {
  const [row] = await getDb()
    .insert(users)
    .values({ telegramId: testTelegramId(`${key}_${label}`), fullName: label, role })
    .returning();
  return row;
}

async function work(title: string, status: 'published' | 'sold' | 'pending') {
  const [row] = await getDb()
    .insert(artworks)
    .values({
      sellerId: artist.id,
      title,
      description: 'Описание.',
      price: 1000,
      heightCm: 30,
      widthCm: 40,
      categoryId,
      techniqueId,
      imageUrl: 'https://example.com/like.png',
      status,
    })
    .returning();
  return row.id;
}

describe('artwork likes', () => {
  beforeAll(async () => {
    artist = await user('artist', 'seller');
    fan = await user('fan');
    other = await user('other');
    await getDb().insert(sellerApplications).values({ userId: artist.id, displayName: `Лайк-студия ${key}`, bio: 'Био.', status: 'approved' });
    [{ id: categoryId }] = await getDb().insert(categories).values({ name: `Лайк-категория ${key}` }).returning();
    [{ id: techniqueId }] = await getDb().insert(techniques).values({ name: `Лайк-техника ${key}` }).returning();
    published = await work('Опубликованная', 'published');
    sold = await work('Проданная', 'sold');
    pending = await work('На модерации', 'pending');
  });

  afterAll(async () => {
    await getDb().delete(artworks).where(eq(artworks.sellerId, artist.id));
    await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, artist.id));
    await getDb().delete(users).where(inArray(users.id, [artist.id, fan.id, other.id]));
    await getDb().delete(categories).where(eq(categories.id, categoryId));
    await getDb().delete(techniques).where(eq(techniques.id, techniqueId));
  });

  it('likes, is idempotent, and unlikes', async () => {
    expect(await setLike(getDb(), { userId: fan.id, artworkId: published, liked: true })).toEqual({ status: 'ok', liked: true, count: 1 });
    expect(await setLike(getDb(), { userId: fan.id, artworkId: published, liked: true })).toEqual({ status: 'ok', liked: true, count: 1 });
    expect(await setLike(getDb(), { userId: other.id, artworkId: published, liked: true })).toEqual({ status: 'ok', liked: true, count: 2 });
    expect(await setLike(getDb(), { userId: other.id, artworkId: published, liked: false })).toEqual({ status: 'ok', liked: false, count: 1 });
    expect(await setLike(getDb(), { userId: other.id, artworkId: published, liked: false })).toEqual({ status: 'ok', liked: false, count: 1 });
  });

  it('an artist cannot like their own work, and hidden works cannot be liked', async () => {
    expect(await setLike(getDb(), { userId: artist.id, artworkId: published, liked: true })).toEqual({ status: 'own' });
    expect(await setLike(getDb(), { userId: fan.id, artworkId: pending, liked: true })).toEqual({ status: 'not_found' });
  });

  it('sold works can be liked', async () => {
    expect(await setLike(getDb(), { userId: fan.id, artworkId: sold, liked: true })).toMatchObject({ status: 'ok', count: 1 });
  });

  it('reports counts, the viewer\'s own likes and button states for a grid', async () => {
    const works = [
      { id: published, sellerId: artist.id },
      { id: sold, sellerId: artist.id },
      { id: pending, sellerId: artist.id },
    ];
    expect(await likeInfoFor(getDb(), works, fan.id)).toEqual({
      [published]: { count: 1, liked: true, state: 'active' },
      [sold]: { count: 1, liked: true, state: 'active' },
      [pending]: { count: 0, liked: false, state: 'active' },
    });
    expect((await likeInfoFor(getDb(), works, other.id))[published]).toEqual({ count: 1, liked: false, state: 'active' });
    expect((await likeInfoFor(getDb(), works, null))[published]).toEqual({ count: 1, liked: false, state: 'guest' });
    expect((await likeInfoFor(getDb(), works, artist.id))[published]).toEqual({ count: 1, liked: false, state: 'own' });
  });

  it('lists favourites newest first', async () => {
    const favourites = await listFavorites(getDb(), fan.id);
    expect(favourites.map((f) => f.id)).toEqual([sold, published]);
    expect(favourites[0]).toMatchObject({ status: 'sold', sellerDisplayName: `Лайк-студия ${key}` });
    expect(await listFavorites(getDb(), other.id)).toEqual([]);
  });

  it('likes disappear with the artwork', async () => {
    await getDb().delete(artworks).where(eq(artworks.id, sold));
    const rows = await getDb().select().from(artworkLikes).where(eq(artworkLikes.artworkId, sold));
    expect(rows).toEqual([]);
  });
});
