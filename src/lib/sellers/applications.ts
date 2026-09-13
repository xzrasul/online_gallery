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
      telegramContact: input.telegramContact,
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

  await db
    .update(sellerApplications)
    .set({
      status: outcome.applicationStatus,
      rejectionReason: outcome.rejectionReason,
      reviewedByAdminId: input.adminUserId,
      reviewedAt: new Date(),
    })
    .where(eq(sellerApplications.id, input.applicationId));

  await db.update(users).set({ role: outcome.role }).where(eq(users.id, application.userId));

  const [user] = await db.select().from(users).where(eq(users.id, application.userId));
  await syncRoleToClerk(user.clerkUserId, outcome.role);
}
