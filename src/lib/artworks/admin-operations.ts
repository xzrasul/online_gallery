import { eq } from 'drizzle-orm';
import type { Db } from '../../db';
import { artworks, categories, techniques, sellerApplications } from '../../db/schema';
import { decideArtworkOutcome } from './decision';

export async function approveOrRejectArtwork(
  db: Db,
  input: {
    artworkId: string;
    adminUserId: string;
    decision: 'approve' | 'reject';
    reason?: string;
  },
): Promise<void> {
  const outcome = decideArtworkOutcome(input.decision, input.reason);

  await db
    .update(artworks)
    .set({
      status: outcome.status,
      rejectionReason: outcome.rejectionReason,
      reviewedByAdminId: input.adminUserId,
      reviewedAt: new Date(),
    })
    .where(eq(artworks.id, input.artworkId));
}

export async function listPendingArtworks(db: Db) {
  return db
    .select({
      id: artworks.id,
      title: artworks.title,
      description: artworks.description,
      price: artworks.price,
      heightCm: artworks.heightCm,
      widthCm: artworks.widthCm,
      imageUrl: artworks.imageUrl,
      categoryName: categories.name,
      techniqueName: techniques.name,
      sellerDisplayName: sellerApplications.displayName,
    })
    .from(artworks)
    .innerJoin(categories, eq(artworks.categoryId, categories.id))
    .innerJoin(techniques, eq(artworks.techniqueId, techniques.id))
    .innerJoin(sellerApplications, eq(artworks.sellerId, sellerApplications.userId))
    .where(eq(artworks.status, 'pending'));
}
