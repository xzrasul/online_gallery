import { eq } from 'drizzle-orm';
import type { Db } from '../../db';
import { users, sellerApplications } from '../../db/schema';
import { decideApplicationOutcome } from './decision';
import { syncRoleToClerk } from '../auth/sync-role';

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

  const updateApplication = db
    .update(sellerApplications)
    .set({
      status: outcome.applicationStatus,
      rejectionReason: outcome.rejectionReason,
      reviewedByAdminId: input.adminUserId,
      reviewedAt: new Date(),
    })
    .where(eq(sellerApplications.id, input.applicationId));

  const updateUserRole = db
    .update(users)
    .set({ role: outcome.role })
    .where(eq(users.id, application.userId));

  await db.batch([updateApplication, updateUserRole]);

  const [user] = await db.select().from(users).where(eq(users.id, application.userId));
  try {
    await syncRoleToClerk(user.clerkUserId, outcome.role);
  } catch (err) {
    console.error(
      'syncRoleToClerk failed (DB role is authoritative, Clerk metadata is a denormalized copy with no current readers):',
      err,
    );
  }
}
