import { test, expect } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, sellerApplications } from '../../src/db/schema';
import { signInAsNewUser } from './helpers/auth';

test('/cabinet sends each user to the cabinet of their role', async ({ page }) => {
  await page.goto('/cabinet');
  await expect(page).toHaveURL(/\/sign-in/);

  const user = await signInAsNewUser(page, 'cabinet_redirect');
  try {
    // the menu's "Профиль" points at /cabinet
    await page.getByRole('button', { name: 'Меню' }).click();
    await expect(
      page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: 'Профиль' }),
    ).toHaveAttribute('href', '/cabinet');

    // buyer without an application: the buyer cabinet (the role picker is only
    // for the first sign-in), with a way to start selling
    await page.goto('/cabinet');
    await expect(page).toHaveURL(/\/dashboard\/buyer$/);
    await expect(page.getByRole('link', { name: 'Подать заявку продавца' })).toHaveAttribute('href', '/become-seller');

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

    // a Telegram account with the old admin role → the staff sign-in page
    await getDb().update(users).set({ role: 'admin' }).where(eq(users.id, user.id));
    await page.goto('/cabinet');
    await expect(page).toHaveURL(/\/sanatadmin/);
  } finally {
    await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, user.id));
    await getDb().delete(users).where(eq(users.id, user.id));
  }
});
