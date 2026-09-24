import { test, expect } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { signInAsNewUser } from './helpers/auth';
import { getDb } from '../../src/db';
import { users, sellerApplications } from '../../src/db/schema';

test('an approved artist edits their profile and the public page shows it at once', async ({ page }) => {
  const seller = await signInAsNewUser(page, 'edit_profile_seller');
  await getDb().update(users).set({ role: 'seller' }).where(eq(users.id, seller.id));
  await getDb().insert(sellerApplications).values({
    userId: seller.id,
    displayName: `E2E профиль до ${Date.now()}`,
    bio: 'Старое описание.',
    telegramContact: '@old_contact',
    status: 'approved',
  });

  try {
    await page.goto('/dashboard/seller');
    await page.getByRole('link', { name: 'Мой профиль' }).click();
    await expect(page).toHaveURL(/\/dashboard\/seller\/profile$/);
    await expect(page.getByLabel('Telegram (необязательно)')).toHaveValue('@old_contact');

    const newName = `E2E профиль после ${Date.now()}`;
    await page.getByLabel('Имя художника/студии').fill(newName);
    await page.getByLabel('О себе').fill('Новое описание: пишу горы Памира.');
    await page.getByLabel('Telegram (необязательно)').fill('');
    await page.getByRole('button', { name: 'Сохранить профиль' }).click();

    await expect(page).toHaveURL(/\/dashboard\/seller\/profile\?saved=1$/, { timeout: 15000 });
    await expect(page.getByRole('status')).toContainText('Профиль сохранён');
    await expect(page.getByLabel('Имя художника/студии')).toHaveValue(newName);

    await page.getByRole('link', { name: 'Посмотреть мою страницу' }).click();
    await expect(page).toHaveURL(new RegExp(`/gallery/artist/${seller.id}$`), { timeout: 15000 });
    await expect(page.getByRole('heading', { name: newName })).toBeVisible();
    await expect(page.getByText('Новое описание: пишу горы Памира.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Написать в Telegram' })).toHaveCount(0);

    const [row] = await getDb().select().from(sellerApplications).where(eq(sellerApplications.userId, seller.id));
    expect(row.status).toBe('approved');
    expect(row.telegramContact).toBeNull();
  } finally {
    await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, seller.id));
    await getDb().delete(users).where(eq(users.id, seller.id));
  }
});

test('a buyer cannot open the profile editor', async ({ page }) => {
  const buyer = await signInAsNewUser(page, 'edit_profile_buyer');
  try {
    await page.goto('/dashboard/seller/profile');
    await expect(page).not.toHaveURL(/\/dashboard\/seller\/profile/);
  } finally {
    await getDb().delete(users).where(eq(users.id, buyer.id));
  }
});
