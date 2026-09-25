import type { Db } from '@/src/db';
import { likeInfoFor, type LikeInfo } from '@/src/lib/likes/likes';
import { showcaseArtwork } from '@/src/lib/showcase';
import type { CardArtwork } from './types';

// Heart state for a mixed list of cards: real works from the database, showcase
// works from their made-up counts (their hearts are kept in the browser).
export async function heartsFor(
  db: Db,
  works: CardArtwork[],
  viewerId: string | null,
): Promise<Record<string, LikeInfo>> {
  const real = works.filter((w) => !w.mock && w.sellerId).map((w) => ({ id: w.id, sellerId: w.sellerId! }));
  const result = await likeInfoFor(db, real, viewerId);
  for (const w of works) {
    if (!w.mock) continue;
    result[w.id] = { count: showcaseArtwork(w.id)?.likes ?? 0, liked: false, state: viewerId ? 'active' : 'guest' };
  }
  return result;
}
