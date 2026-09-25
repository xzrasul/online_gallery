import { and, asc, count, desc, eq, gte, ilike, inArray, lte, min, or, sql, type SQL } from 'drizzle-orm';
import type { Db } from '../../db';
import { artworks, categories, techniques, sellerApplications } from '../../db/schema';

export type CatalogSort = 'new' | 'asc' | 'desc' | 'az';

const ORDER: Record<CatalogSort, SQL[]> = {
  new: [desc(artworks.submittedAt)],
  asc: [asc(artworks.price), desc(artworks.submittedAt)],
  desc: [desc(artworks.price), desc(artworks.submittedAt)],
  az: [asc(artworks.title), desc(artworks.submittedAt)],
};

// `q` matches the title or the artist's name, case-insensitively; % and _ are literal.
export async function listPublishedArtworks(
  db: Db,
  filters: {
    categoryId?: string;
    techniqueId?: string;
    sellerId?: string;
    minPrice?: number;
    maxPrice?: number;
    q?: string;
  },
  pagination: { page: number; pageSize: number },
  sort: CatalogSort = 'new',
) {
  const conditions: (SQL | undefined)[] = [eq(artworks.status, 'published')];
  if (filters.categoryId) conditions.push(eq(artworks.categoryId, filters.categoryId));
  if (filters.techniqueId) conditions.push(eq(artworks.techniqueId, filters.techniqueId));
  if (filters.sellerId) conditions.push(eq(artworks.sellerId, filters.sellerId));
  if (filters.minPrice !== undefined) conditions.push(gte(artworks.price, filters.minPrice));
  if (filters.maxPrice !== undefined) conditions.push(lte(artworks.price, filters.maxPrice));
  const q = filters.q?.trim();
  if (q) {
    const pattern = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    conditions.push(or(ilike(artworks.title, pattern), ilike(sellerApplications.displayName, pattern)));
  }
  const where = and(...conditions);

  const items = await db
    .select({
      id: artworks.id,
      title: artworks.title,
      price: artworks.price,
      imageUrl: artworks.imageUrl,
      sellerId: artworks.sellerId,
      sellerDisplayName: sellerApplications.displayName,
    })
    .from(artworks)
    .innerJoin(sellerApplications, eq(artworks.sellerId, sellerApplications.userId))
    .where(where)
    .orderBy(...ORDER[sort])
    .limit(pagination.pageSize)
    .offset((pagination.page - 1) * pagination.pageSize);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(artworks)
    .innerJoin(sellerApplications, eq(artworks.sellerId, sellerApplications.userId))
    .where(where);

  return { items, total };
}

// How many works on sale each category has (for the catalog's category chips).
export async function countPublishedByCategory(db: Db): Promise<Map<string, number>> {
  const rows = await db
    .select({ categoryId: artworks.categoryId, n: count() })
    .from(artworks)
    .where(eq(artworks.status, 'published'))
    .groupBy(artworks.categoryId);
  return new Map(rows.map((r) => [r.categoryId, r.n]));
}

// Approved artists with how many works they have on sale and the lowest price.
export async function listPublicArtists(db: Db) {
  return db
    .select({
      id: sellerApplications.userId,
      displayName: sellerApplications.displayName,
      joinedAt: sellerApplications.reviewedAt,
      works: sql<number>`count(${artworks.id})::int`,
      minPrice: min(artworks.price),
    })
    .from(sellerApplications)
    .leftJoin(
      artworks,
      and(eq(artworks.sellerId, sellerApplications.userId), eq(artworks.status, 'published')),
    )
    .where(eq(sellerApplications.status, 'approved'))
    .groupBy(sellerApplications.userId, sellerApplications.displayName, sellerApplications.reviewedAt)
    .orderBy(desc(sql`count(${artworks.id})`), asc(sellerApplications.displayName));
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
      categoryId: artworks.categoryId,
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
