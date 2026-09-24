import { inArray, max, sql } from 'drizzle-orm';
import type { Db } from '../../db';
import { artworks } from '../../db/schema';

const PUBLIC = ['published', 'sold'] as const;

// Every public artwork, and every artist with at least one public work, with
// the date it last changed (moderation, or submission if never reviewed).
export async function listSitemapEntries(db: Db) {
  const changed = sql<Date>`coalesce(${artworks.reviewedAt}, ${artworks.submittedAt})`;
  const [works, artists] = await Promise.all([
    db.select({ id: artworks.id, changedAt: changed }).from(artworks).where(inArray(artworks.status, [...PUBLIC])),
    db
      .select({ id: artworks.sellerId, changedAt: max(changed) })
      .from(artworks)
      .where(inArray(artworks.status, [...PUBLIC]))
      .groupBy(artworks.sellerId),
  ]);
  return { works, artists };
}
