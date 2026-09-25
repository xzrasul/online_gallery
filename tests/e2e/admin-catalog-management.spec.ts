import { test, expect } from '@playwright/test';
import { signInAsNewUser, signInAsStaff } from './helpers/auth';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, categories, techniques } from '../../src/db/schema';

test('admin creates and renames a category and a technique', async ({ page }) => {
  const adminUser = await signInAsNewUser(page, 'catalog_admin');
  await signInAsStaff(page, 'moderator');

  const categoryName = `E2E категория ${Date.now()}`;
  const renamedCategoryName = `${categoryName} (переименовано)`;
  const techniqueName = `E2E техника ${Date.now()}`;

  try {
    await page.goto('/admin/categories');
    await page.getByPlaceholder('Новая категория').fill(categoryName);
    await page.getByRole('button', { name: 'Добавить' }).click();
    const categoryInput = page.locator(`input[name="name"][value="${categoryName}"]`);
    await expect(categoryInput).toBeVisible();

    await categoryInput.fill(renamedCategoryName);
    await categoryInput.locator('xpath=..').getByRole('button', { name: 'Переименовать' }).click();
    await expect(page.locator(`input[name="name"][value="${renamedCategoryName}"]`)).toBeVisible();

    await page.goto('/admin/techniques');
    await page.getByPlaceholder('Новая техника').fill(techniqueName);
    await page.getByRole('button', { name: 'Добавить' }).click();
    await expect(page.locator(`input[name="name"][value="${techniqueName}"]`)).toBeVisible();
  } finally {
    await getDb().delete(categories).where(eq(categories.name, categoryName));
    await getDb().delete(categories).where(eq(categories.name, renamedCategoryName));
    await getDb().delete(techniques).where(eq(techniques.name, techniqueName));
    await getDb().delete(users).where(eq(users.id, adminUser.id));
  }
});
