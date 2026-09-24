import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import type { Db } from '../../db';
import { artworks, categories, techniques, sellerApplications } from '../../db/schema';

export async function listPublishedArtworks(
  db: Db,
  filters: { categoryId?: string; techniqueId?: string; minPrice?: number; maxPrice?: number },
  pagination: { page: number; pageSize: number },
) {
  const conditions = [eq(artworks.status, 'published')];
  if (filters.categoryId) conditions.push(eq(artworks.categoryId, filters.categoryId));
  if (filters.techniqueId) conditions.push(eq(artworks.techniqueId, filters.techniqueId));
  if (filters.minPrice !== undefined) conditions.push(gte(artworks.price, filters.minPrice));
  if (filters.maxPrice !== undefined) conditions.push(lte(artworks.price, filters.maxPrice));
  const where = and(...conditions);

  const items = await db
    .select({
      id: artworks.id,
      title: artworks.title,
      price: artworks.price,
      imageUrl: artworks.imageUrl,
      sellerDisplayName: sellerApplications.displayName,
    })
    .from(artworks)
    .innerJoin(sellerApplications, eq(artworks.sellerId, sellerApplications.userId))
    .where(where)
    .orderBy(sql`${artworks.submittedAt} desc`)
    .limit(pagination.pageSize)
    .offset((pagination.page - 1) * pagination.pageSize);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(artworks)
    .where(where);

  return { items, total: count };
}

export async function getPublishedArtworkById(db: Db, id: string) {
  const [row] = await db
    .select({
      id: artworks.id,
      title: artworks.title,
      description: artworks.description,
      price: artworks.price,
      heightCm: artworks.heightCm,
      widthCm: artworks.widthCm,
      imageUrl: artworks.imageUrl,
      status: artworks.status,
      categoryName: categories.name,
      techniqueName: techniques.name,
      sellerId: artworks.sellerId,
      sellerDisplayName: sellerApplications.displayName,
      sellerTelegramContact: sellerApplications.telegramContact,
    })
    .from(artworks)
    .innerJoin(categories, eq(artworks.categoryId, categories.id))
    .innerJoin(techniques, eq(artworks.techniqueId, techniques.id))
    .innerJoin(sellerApplications, eq(artworks.sellerId, sellerApplications.userId))
    .where(and(eq(artworks.id, id), inArray(artworks.status, ['published', 'sold'])));
  return row;
}

// An artist's public page: profile, when they joined (application approval),
// and their published and sold works, newest first.
export async function getArtistPublicProfile(db: Db, sellerId: string) {
  const [profile] = await db
    .select({
      displayName: sellerApplications.displayName,
      bio: sellerApplications.bio,
      telegramContact: sellerApplications.telegramContact,
      joinedAt: sellerApplications.reviewedAt,
    })
    .from(sellerApplications)
    .where(eq(sellerApplications.userId, sellerId));
  if (!profile) return undefined;

  const artworkRows = await db
    .select({
      id: artworks.id,
      title: artworks.title,
      price: artworks.price,
      imageUrl: artworks.imageUrl,
      status: artworks.status,
    })
    .from(artworks)
    .where(and(eq(artworks.sellerId, sellerId), inArray(artworks.status, ['published', 'sold'])))
    .orderBy(desc(artworks.submittedAt));

  return { ...profile, artworks: artworkRows };
}
