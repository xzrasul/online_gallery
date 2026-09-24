import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import type { Db } from '../../db';
import { artworkLikes, artworks, sellerApplications } from '../../db/schema';

// Only works the public can see can be liked (and keep their likes once sold).
const VISIBLE = ['published', 'sold'] as const;

export type SetLikeResult = { status: 'ok'; liked: boolean; count: number } | { status: 'not_found' } | { status: 'own' };

// Sets (not toggles) the user's like, so a repeated click or a retried
// request lands in the same state. Artists cannot like their own works.
export async function setLike(
  db: Db,
  input: { userId: string; artworkId: string; liked: boolean },
): Promise<SetLikeResult> {
  const [artwork] = await db
    .select({ sellerId: artworks.sellerId })
    .from(artworks)
    .where(and(eq(artworks.id, input.artworkId), inArray(artworks.status, [...VISIBLE])));
  if (!artwork) return { status: 'not_found' };
  if (artwork.sellerId === input.userId) return { status: 'own' };

  if (input.liked) {
    await db.insert(artworkLikes).values({ userId: input.userId, artworkId: input.artworkId }).onConflictDoNothing();
  } else {
    await db
      .delete(artworkLikes)
      .where(and(eq(artworkLikes.userId, input.userId), eq(artworkLikes.artworkId, input.artworkId)));
  }
  const [row] = await db.select({ n: count() }).from(artworkLikes).where(eq(artworkLikes.artworkId, input.artworkId));
  return { status: 'ok', liked: input.liked, count: row.n };
}

// How a like button renders for one artwork and one viewer.
export type LikeInfo = { count: number; liked: boolean; state: 'guest' | 'own' | 'active' };

// Like counts, and whether the viewer liked each work, for a whole grid in one query.
export async function likeInfoFor(
  db: Db,
  works: { id: string; sellerId: string }[],
  viewerId: string | null,
): Promise<Record<string, LikeInfo>> {
  const result: Record<string, LikeInfo> = {};
  if (works.length === 0) return result;
  const rows = await db
    .select({
      artworkId: artworkLikes.artworkId,
      n: count(),
      mine: viewerId
        ? sql<boolean>`coalesce(bool_or(${artworkLikes.userId} = ${viewerId}), false)`
        : sql<boolean>`false`,
    })
    .from(artworkLikes)
    .where(
      inArray(
        artworkLikes.artworkId,
        works.map((w) => w.id),
      ),
    )
    .groupBy(artworkLikes.artworkId);
  const byId = new Map(rows.map((r) => [r.artworkId, r]));
  for (const w of works) {
    const r = byId.get(w.id);
    result[w.id] = {
      count: r?.n ?? 0,
      liked: Boolean(r?.mine),
      state: !viewerId ? 'guest' : w.sellerId === viewerId ? 'own' : 'active',
    };
  }
  return result;
}

// The user's favourites: works they liked that are still public, most recently liked first.
export async function listFavorites(db: Db, userId: string) {
  return db
    .select({
      id: artworks.id,
      title: artworks.title,
      price: artworks.price,
      imageUrl: artworks.imageUrl,
      status: artworks.status,
      sellerId: artworks.sellerId,
      sellerDisplayName: sellerApplications.displayName,
    })
    .from(artworkLikes)
    .innerJoin(artworks, eq(artworkLikes.artworkId, artworks.id))
    .innerJoin(sellerApplications, eq(artworks.sellerId, sellerApplications.userId))
    .where(and(eq(artworkLikes.userId, userId), inArray(artworks.status, [...VISIBLE])))
    .orderBy(desc(artworkLikes.createdAt));
}
