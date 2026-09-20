import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, sellerApplications } from '../../src/db/schema';
import { signUpWithEmail } from './helpers/clerk';

test('/cabinet sends each user to the cabinet of their role', async ({ page }) => {
  await page.goto('/cabinet');
  await expect(page).toHaveURL(/\/sign-in/);

  await setupClerkTestingToken({ page });
  const email = `cabinet+clerk_test_${Date.now()}@example.com`;
  const password = `Xk9#mQ2vLp${Date.now()}!`;
  await signUpWithEmail(page, email, password);
  await expect(page).toHaveURL(/\/choose-role/, { timeout: 15000 });

  const [user] = await getDb().select().from(users).where(eq(users.email, email));
  try {
    // the header link points at /cabinet
    await expect(page.getByRole('banner').getByRole('link', { name: 'Личный кабинет' })).toHaveAttribute('href', '/cabinet');

    // new buyer without an application: the role picker
    await page.goto('/cabinet');
    await expect(page).toHaveURL(/\/choose-role/);

    // buyer with an application: the application status page
    await getDb().insert(sellerApplications).values({
      userId: user.id,
      displayName: `Кабинет-тест ${Date.now()}`,
      bio: 'Био.',
      status: 'pending',
    });
    await page.goto('/cabinet');
    await expect(page).toHaveURL(/\/become-seller\/status/);

    // seller → seller cabinet
    await getDb().update(users).set({ role: 'seller' }).where(eq(users.id, user.id));
    await page.goto('/cabinet');
    await expect(page).toHaveURL(/\/dashboard\/seller/);

    // admin → admin area
    await getDb().update(users).set({ role: 'admin' }).where(eq(users.id, user.id));
    await page.goto('/cabinet');
    await expect(page).toHaveURL(/\/admin\/sellers/);
  } finally {
    await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, user.id));
    await getDb().delete(users).where(eq(users.id, user.id));
  }
});
