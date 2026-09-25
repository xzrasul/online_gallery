import { and, eq, inArray, or } from 'drizzle-orm';
import type { Db } from '../../db';
import { artworks, homeCollage } from '../../db/schema';
import { isCollageSlot, type CollageSlot, type CollageWork } from './collage-slots';

// Works the public can see: the collage shows the same ones as the catalog pages.
const ON_SALE = ['published', 'sold'] as const;

// The admin's picks, only those whose work is still on sale.
export async function loadCollagePicks(db: Db): Promise<Partial<Record<CollageSlot, CollageWork>>> {
  const rows = await db
    .select({ slot: homeCollage.slot, id: artworks.id, title: artworks.title, imageUrl: artworks.imageUrl })
    .from(homeCollage)
    .innerJoin(artworks, eq(homeCollage.artworkId, artworks.id))
    .where(inArray(artworks.status, [...ON_SALE]));
  const picks: Partial<Record<CollageSlot, CollageWork>> = {};
  for (const { slot, ...work } of rows) if (isCollageSlot(slot)) picks[slot] = work;
  return picks;
}

// Puts a work in a slot (leaving whatever slot it was in). False when the work
// is not on sale.
export async function setCollageSlot(db: Db, slot: CollageSlot, artworkId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [work] = await tx
      .select({ id: artworks.id })
      .from(artworks)
      .where(and(eq(artworks.id, artworkId), inArray(artworks.status, [...ON_SALE])));
    if (!work) return false;
    await tx.delete(homeCollage).where(or(eq(homeCollage.slot, slot), eq(homeCollage.artworkId, artworkId)));
    await tx.insert(homeCollage).values({ slot, artworkId });
    return true;
  });
}

// Back to the newest work.
export async function clearCollageSlot(db: Db, slot: CollageSlot) {
  await db.delete(homeCollage).where(eq(homeCollage.slot, slot));
}
