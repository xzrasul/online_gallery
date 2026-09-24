import { and, eq } from 'drizzle-orm';
import type { Db } from '../../db';
import { users, sellerApplications } from '../../db/schema';
import { decideApplicationOutcome } from './decision';

export async function createSellerApplication(
  db: Db,
  input: { userId: string; displayName: string; bio: string; telegramContact?: string },
): Promise<string> {
  const [row] = await db
    .insert(sellerApplications)
    .values({
      userId: input.userId,
      displayName: input.displayName,
      bio: input.bio,
      telegramContact: input.telegramContact ?? null,
    })
    .onConflictDoUpdate({
      target: sellerApplications.userId,
      set: {
        displayName: input.displayName,
        bio: input.bio,
        telegramContact: input.telegramContact ?? null,
        status: 'pending',
        rejectionReason: null,
        reviewedByAdminId: null,
        reviewedAt: null,
        submittedAt: new Date(),
      },
    })
    .returning({ id: sellerApplications.id });
  return row.id;
}

// The approved artist's public profile, or null if the user has no approved application.
export async function getSellerProfile(
  db: Db,
  userId: string,
): Promise<{ displayName: string; bio: string; telegramContact: string | null } | null> {
  const [row] = await db
    .select({
      displayName: sellerApplications.displayName,
      bio: sellerApplications.bio,
      telegramContact: sellerApplications.telegramContact,
    })
    .from(sellerApplications)
    .where(and(eq(sellerApplications.userId, userId), eq(sellerApplications.status, 'approved')));
  return row ?? null;
}

// An approved artist edits their own profile. Changes go live at once (no new
// review) and the seller keeps their role and artworks. Returns false when the
// user has no approved application to edit.
export async function updateSellerProfile(
  db: Db,
  input: { userId: string; displayName: string; bio: string; telegramContact?: string },
): Promise<boolean> {
  const rows = await db
    .update(sellerApplications)
    .set({
      displayName: input.displayName,
      bio: input.bio,
      telegramContact: input.telegramContact ?? null,
    })
    .where(and(eq(sellerApplications.userId, input.userId), eq(sellerApplications.status, 'approved')))
    .returning({ id: sellerApplications.id });
  return rows.length > 0;
}

export async function approveOrRejectApplication(
  db: Db,
  input: {
    applicationId: string;
    adminUserId: string;
    decision: 'approve' | 'reject';
    reason?: string;
  },
): Promise<void> {
  const outcome = decideApplicationOutcome(input.decision, input.reason);

  const [application] = await db
    .select()
    .from(sellerApplications)
    .where(eq(sellerApplications.id, input.applicationId));

  await db.transaction(async (tx) => {
    await tx
      .update(sellerApplications)
      .set({
        status: outcome.applicationStatus,
        rejectionReason: outcome.rejectionReason,
        reviewedByAdminId: input.adminUserId,
        reviewedAt: new Date(),
      })
      .where(eq(sellerApplications.id, input.applicationId));

    await tx.update(users).set({ role: outcome.role }).where(eq(users.id, application.userId));
  });
}
