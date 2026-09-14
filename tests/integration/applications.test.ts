import { vi } from 'vitest';
vi.mock('../../src/lib/auth/sync-role', () => ({
  syncRoleToClerk: vi.fn().mockResolvedValue(undefined),
}));

import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, sellerApplications } from '../../src/db/schema';
import {
  createSellerApplication,
  approveOrRejectApplication,
} from '../../src/lib/sellers/applications';

async function insertTestUser(clerkUserId: string) {
  const [row] = await getDb()
    .insert(users)
    .values({ clerkUserId, email: `${clerkUserId}@example.com`, fullName: 'Test User' })
    .returning();
  return row;
}

describe('seller applications', () => {
  const clerkIds = new Set<string>();

  afterEach(async () => {
    for (const id of clerkIds) {
      const [user] = await getDb().select().from(users).where(eq(users.clerkUserId, id));
      if (user) {
        await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, user.id));
        await getDb().delete(users).where(eq(users.id, user.id));
      }
    }
    clerkIds.clear();
  });

  it('creates a pending application and leaves the user role as buyer', async () => {
    clerkIds.add('test_applicant_1');
    const applicant = await insertTestUser('test_applicant_1');

    const applicationId = await createSellerApplication(getDb(), {
      userId: applicant.id,
      displayName: 'Мастерская Ивана',
      bio: 'Пишу пейзажи маслом.',
    });

    const [application] = await getDb()
      .select()
      .from(sellerApplications)
      .where(eq(sellerApplications.id, applicationId));
    expect(application.status).toBe('pending');

    const [user] = await getDb().select().from(users).where(eq(users.id, applicant.id));
    expect(user.role).toBe('buyer');
  });

  it('approving grants the seller role and marks the application approved', async () => {
    clerkIds.add('test_applicant_2');
    clerkIds.add('test_admin_1');
    const applicant = await insertTestUser('test_applicant_2');
    const admin = await insertTestUser('test_admin_1');
    const applicationId = await createSellerApplication(getDb(), {
      userId: applicant.id,
      displayName: 'Студия Анны',
      bio: 'Акварель.',
    });

    await approveOrRejectApplication(getDb(), {
      applicationId,
      adminUserId: admin.id,
      decision: 'approve',
    });

    const [application] = await getDb()
      .select()
      .from(sellerApplications)
      .where(eq(sellerApplications.id, applicationId));
    expect(application.status).toBe('approved');
    expect(application.reviewedByAdminId).toBe(admin.id);

    const [user] = await getDb().select().from(users).where(eq(users.id, applicant.id));
    expect(user.role).toBe('seller');
  });

  it('rejecting keeps the buyer role and stores the reason', async () => {
    clerkIds.add('test_applicant_3');
    clerkIds.add('test_admin_2');
    const applicant = await insertTestUser('test_applicant_3');
    const admin = await insertTestUser('test_admin_2');
    const applicationId = await createSellerApplication(getDb(), {
      userId: applicant.id,
      displayName: 'Галерея Марата',
      bio: 'Графика.',
    });

    await approveOrRejectApplication(getDb(), {
      applicationId,
      adminUserId: admin.id,
      decision: 'reject',
      reason: 'Нужно больше примеров работ',
    });

    const [application] = await getDb()
      .select()
      .from(sellerApplications)
      .where(eq(sellerApplications.id, applicationId));
    expect(application.status).toBe('rejected');
    expect(application.rejectionReason).toBe('Нужно больше примеров работ');

    const [user] = await getDb().select().from(users).where(eq(users.id, applicant.id));
    expect(user.role).toBe('buyer');
  });

  it('resubmitting after rejection upserts the same row instead of throwing', async () => {
    clerkIds.add('test_applicant_4');
    clerkIds.add('test_admin_3');
    const applicant = await insertTestUser('test_applicant_4');
    const admin = await insertTestUser('test_admin_3');
    const firstApplicationId = await createSellerApplication(getDb(), {
      userId: applicant.id,
      displayName: 'Мастерская Олега',
      bio: 'Скульптура.',
      telegramContact: '@oleg_art',
    });

    await approveOrRejectApplication(getDb(), {
      applicationId: firstApplicationId,
      adminUserId: admin.id,
      decision: 'reject',
      reason: 'Недостаточно примеров',
    });

    const secondApplicationId = await createSellerApplication(getDb(), {
      userId: applicant.id,
      displayName: 'Мастерская Олега (обновлено)',
      bio: 'Скульптура и керамика.',
    });

    expect(secondApplicationId).toBe(firstApplicationId);

    const applications = await getDb()
      .select()
      .from(sellerApplications)
      .where(eq(sellerApplications.userId, applicant.id));
    expect(applications).toHaveLength(1);

    const [application] = applications;
    expect(application.status).toBe('pending');
    expect(application.rejectionReason).toBeNull();
    expect(application.displayName).toBe('Мастерская Олега (обновлено)');
    expect(application.bio).toBe('Скульптура и керамика.');
    // The resubmission omitted telegramContact, so the previously set value
    // ('@oleg_art') must be cleared to null, not silently left stale.
    expect(application.telegramContact).toBeNull();
  });
});
