import { and, eq } from 'drizzle-orm';
import type { Db } from '../../db';
import { artworks } from '../../db/schema';

type ArtworkInput = {
  sellerId: string;
  title: string;
  description: string;
  price: number;
  heightCm: number;
  widthCm: number;
  categoryId: string;
  techniqueId: string;
  imageUrl: string;
  year?: number | null;
  // the stored photo's size; left out on an edit that keeps the old photo
  widthPx?: number;
  heightPx?: number;
};

export async function createArtwork(db: Db, input: ArtworkInput): Promise<string> {
  const [row] = await db
    .insert(artworks)
    .values({
      sellerId: input.sellerId,
      title: input.title,
      description: input.description,
      price: input.price,
      heightCm: input.heightCm,
      widthCm: input.widthCm,
      categoryId: input.categoryId,
      techniqueId: input.techniqueId,
      imageUrl: input.imageUrl,
      year: input.year ?? null,
      widthPx: input.widthPx ?? null,
      heightPx: input.heightPx ?? null,
    })
    .returning({ id: artworks.id });
  return row.id;
}

export async function updateArtwork(
  db: Db,
  input: ArtworkInput & { artworkId: string },
): Promise<void> {
  const result = await db
    .update(artworks)
    .set({
      title: input.title,
      description: input.description,
      price: input.price,
      heightCm: input.heightCm,
      widthCm: input.widthCm,
      categoryId: input.categoryId,
      techniqueId: input.techniqueId,
      imageUrl: input.imageUrl,
      ...(input.year !== undefined && { year: input.year }),
      ...(input.widthPx !== undefined && { widthPx: input.widthPx, heightPx: input.heightPx }),
      status: 'pending',
      rejectionReason: null,
      reviewedAt: null,
      reviewedByAdminId: null,
      submittedAt: new Date(),
    })
    .where(and(eq(artworks.id, input.artworkId), eq(artworks.sellerId, input.sellerId)))
    .returning({ id: artworks.id });

  if (result.length === 0) {
    throw new Error('Artwork not found');
  }
}

export async function markArtworkAsSold(
  db: Db,
  input: { artworkId: string; sellerId: string },
): Promise<void> {
  const result = await db
    .update(artworks)
    .set({ status: 'sold' })
    .where(
      and(
        eq(artworks.id, input.artworkId),
        eq(artworks.sellerId, input.sellerId),
        eq(artworks.status, 'published'),
      ),
    )
    .returning({ id: artworks.id });

  if (result.length === 0) {
    throw new Error('Artwork not found or not published');
  }
}

export async function listArtworksForSeller(db: Db, sellerId: string) {
  return db.select().from(artworks).where(eq(artworks.sellerId, sellerId));
}

export async function getArtworkForOwner(
  db: Db,
  input: { artworkId: string; sellerId: string },
) {
  const [row] = await db
    .select()
    .from(artworks)
    .where(and(eq(artworks.id, input.artworkId), eq(artworks.sellerId, input.sellerId)));
  return row;
}
