import { test, expect } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, sellerApplications, categories, techniques, artworks, homeCollage } from '../../src/db/schema';
import { testTelegramId } from '../helpers/test-telegram-id';
import { signInAsStaff } from './helpers/auth';

test('the admin picks the big collage picture and the home page shows it', async ({ page, baseURL }) => {
  // the site's database: the admin's real picks are put back afterwards
  const saved = await getDb().select().from(homeCollage);
  await getDb().delete(homeCollage);

  const stamp = Date.now();
  const [seller] = await getDb()
    .insert(users)
    .values({ telegramId: testTelegramId(`test_collage_seller_${stamp}`), fullName: 'Collage E2E Seller', role: 'seller' })
    .returning();
  await getDb().insert(sellerApplications).values({
    userId: seller.id,
    displayName: `Коллаж-е2е студия ${stamp}`,
    bio: 'Био.',
    status: 'approved',
  });
  const [category] = await getDb().insert(categories).values({ name: `Коллаж категория ${stamp}` }).returning();
  const [technique] = await getDb().insert(techniques).values({ name: `Коллаж техника ${stamp}` }).returning();
  const title = `Коллаж картина ${stamp}`;
  const [work] = await getDb()
    .insert(artworks)
    .values({
      sellerId: seller.id,
      title,
      description: 'Описание.',
      price: 1000,
      heightCm: 30,
      widthCm: 40,
      categoryId: category.id,
      techniqueId: technique.id,
      imageUrl: 'https://example.com/collage.png',
      status: 'published',
      // older than everything else, so only the admin's pick can put it on the collage
      submittedAt: new Date('2000-01-01'),
    })
    .returning();

  try {
    await signInAsStaff(page, 'admin', baseURL);
    await page.goto('/admin/collage');
    await expect(page.getByRole('heading', { name: 'Коллаж на главной', level: 1 })).toBeVisible();
    await page.getByLabel('Поиск работ').fill(title);
    await page.getByRole('button', { name: 'Найти' }).click();
    await page.getByRole('button', { name: `Большая: ${title}` }).click();
    await expect(page.getByRole('region', { name: 'Большая' }).getByText(title)).toBeVisible();

    await page.goto('/');
    await expect(page.locator('.collage .tile.a')).toHaveAttribute('href', `/gallery/artwork/${work.id}`);

    // back to automatic
    await page.goto('/admin/collage');
    await page.getByRole('region', { name: 'Большая' }).getByRole('button', { name: 'Авто' }).click();
    await expect(page.getByRole('region', { name: 'Большая' }).getByText('Авто: самая новая работа')).toBeVisible();
  } finally {
    await getDb().delete(homeCollage);
    await getDb().delete(artworks).where(eq(artworks.sellerId, seller.id));
    await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, seller.id));
    await getDb().delete(users).where(eq(users.id, seller.id));
    await getDb().delete(categories).where(eq(categories.id, category.id));
    await getDb().delete(techniques).where(eq(techniques.id, technique.id));
    if (saved.length) await getDb().insert(homeCollage).values(saved);
  }
});

test('a moderator cannot open the collage settings', async ({ page, baseURL }) => {
  await signInAsStaff(page, 'moderator', baseURL);
  await page.goto('/admin/sellers');
  await expect(page.getByRole('link', { name: 'Коллаж на главной' })).toHaveCount(0);
  await page.goto('/admin/collage');
  await expect(page).toHaveURL(/\/admin\/sellers$/);
});
