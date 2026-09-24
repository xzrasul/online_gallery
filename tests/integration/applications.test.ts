import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, sellerApplications } from '../../src/db/schema';
import {
  createSellerApplication,
  approveOrRejectApplication,
  getSellerProfile,
  updateSellerProfile,
} from '../../src/lib/sellers/applications';
import { testTelegramId } from '../helpers/test-telegram-id';

async function insertTestUser(userKey: string) {
  const [row] = await getDb()
    .insert(users)
    .values({ telegramId: testTelegramId(userKey), fullName: 'Test User' })
    .returning();
  return row;
}

describe('seller applications', () => {
  const userKeys = new Set<string>();

  afterEach(async () => {
    for (const id of userKeys) {
      const [user] = await getDb().select().from(users).where(eq(users.telegramId, testTelegramId(id)));
      if (user) {
        await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, user.id));
        await getDb().delete(users).where(eq(users.id, user.id));
      }
    }
    userKeys.clear();
  });

  it('creates a pending application and leaves the user role as buyer', async () => {
    userKeys.add('test_applicant_1');
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
    userKeys.add('test_applicant_2');
    userKeys.add('test_admin_1');
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
    userKeys.add('test_applicant_3');
    userKeys.add('test_admin_2');
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
    userKeys.add('test_applicant_4');
    userKeys.add('test_admin_3');
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

  it('an approved artist edits their profile: live at once, still approved and a seller', async () => {
    userKeys.add('test_applicant_5');
    userKeys.add('test_admin_4');
    const applicant = await insertTestUser('test_applicant_5');
    const admin = await insertTestUser('test_admin_4');
    const applicationId = await createSellerApplication(getDb(), {
      userId: applicant.id,
      displayName: 'Студия Зарины',
      bio: 'Сюзане.',
      telegramContact: '@zarina',
    });
    await approveOrRejectApplication(getDb(), { applicationId, adminUserId: admin.id, decision: 'approve' });

    const updated = await updateSellerProfile(getDb(), {
      userId: applicant.id,
      displayName: 'Студия Зарины Каримовой',
      bio: 'Сюзане и батик.',
    });

    expect(updated).toBe(true);
    expect(await getSellerProfile(getDb(), applicant.id)).toEqual({
      displayName: 'Студия Зарины Каримовой',
      bio: 'Сюзане и батик.',
      telegramContact: null,
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

  it('a profile cannot be edited before the application is approved', async () => {
    userKeys.add('test_applicant_6');
    const applicant = await insertTestUser('test_applicant_6');
    await createSellerApplication(getDb(), { userId: applicant.id, displayName: 'Ожидает', bio: 'Био.' });

    const updated = await updateSellerProfile(getDb(), {
      userId: applicant.id,
      displayName: 'Подмена',
      bio: 'Другое био.',
    });

    expect(updated).toBe(false);
    expect(await getSellerProfile(getDb(), applicant.id)).toBeNull();
    const [application] = await getDb()
      .select()
      .from(sellerApplications)
      .where(eq(sellerApplications.userId, applicant.id));
    expect(application.displayName).toBe('Ожидает');
  });
});
