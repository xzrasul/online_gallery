import { test, expect } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { artworks, categories, sellerApplications, techniques, users } from '../../src/db/schema';
import { createArtwork } from '../../src/lib/artworks/seller-operations';
import { testTelegramId } from '../helpers/test-telegram-id';
import { signInAsNewUser } from './helpers/auth';

async function seedArtist(label: string) {
  const [artist] = await getDb()
    .insert(users)
    .values({ telegramId: testTelegramId(`${label}_${Date.now()}`), fullName: 'Likes Artist', role: 'seller' })
    .returning();
  await getDb()
    .insert(sellerApplications)
    .values({ userId: artist.id, displayName: `Лайк-студия ${Date.now()}`, bio: 'Био.', status: 'approved' });
  const [category] = await getDb().insert(categories).values({ name: `Лайк-категория ${Date.now()}` }).returning();
  const [technique] = await getDb().insert(techniques).values({ name: `Лайк-техника ${Date.now()}` }).returning();
  const title = `Лайк-картина ${Date.now()}`;
  const artworkId = await createArtwork(getDb(), {
    sellerId: artist.id,
    title,
    description: 'Описание.',
    price: 1400,
    heightCm: 30,
    widthCm: 40,
    categoryId: category.id,
    techniqueId: technique.id,
    imageUrl: 'https://example.com/likes.png',
  });
  await getDb().update(artworks).set({ status: 'published' }).where(eq(artworks.id, artworkId));
  const cleanup = async () => {
    await getDb().delete(artworks).where(eq(artworks.sellerId, artist.id));
    await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, artist.id));
    await getDb().delete(users).where(eq(users.id, artist.id));
    await getDb().delete(categories).where(eq(categories.id, category.id));
    await getDb().delete(techniques).where(eq(techniques.id, technique.id));
  };
  return { artist, artworkId, title, cleanup };
}

test('a guest signs in from the heart, comes back, likes, and finds the work in favourites', async ({ page }) => {
  // five pages and a server action: the dev server compiles several of them on first use
  test.setTimeout(90_000);
  const { artworkId, title, cleanup } = await seedArtist('likes_artist');
  const fanTelegramId = testTelegramId(`likes_fan_${Date.now()}`);
  try {
    await page.goto(`/gallery/artwork/${artworkId}`);
    await page.getByRole('link', { name: /Войдите, чтобы добавить в избранное/ }).click();
    await expect(page).toHaveURL(/\/sign-in\?next=/, { timeout: 15000 });
    await expect(page.getByText('После входа вы вернётесь туда, где были.')).toBeVisible();

    const devLogin = page.getByRole('form', { name: 'Вход для разработки' });
    await devLogin.getByLabel('Telegram ID').fill(String(fanTelegramId));
    await devLogin.getByRole('button', { name: 'Войти как тестовый пользователь' }).click();
    await expect(page).toHaveURL(/\/choose-role\?next=/, { timeout: 15000 });
    await page.getByRole('button', { name: 'Я покупатель' }).click();
    await expect(page).toHaveURL(new RegExp(`/gallery/artwork/${artworkId}$`), { timeout: 15000 });

    const heart = page.getByRole('button', { name: /Добавить в избранное/ });
    await expect(heart).toHaveAttribute('aria-pressed', 'false');
    await heart.click();
    const liked = page.getByRole('button', { name: /Убрать из избранного\. 1 лайк$/ });
    await expect(liked).toHaveAttribute('aria-pressed', 'true');
    await expect(liked).not.toHaveAttribute('aria-busy'); // the server has confirmed

    await page.reload();
    await expect(page.getByRole('button', { name: /Убрать из избранного\. 1 лайк$/ })).toBeVisible();

    await page.getByRole('banner').getByRole('link', { name: /Wishlist/ }).click();
    await expect(page).toHaveURL(/\/favorites$/, { timeout: 15000 });
    await expect(page.getByText(title)).toBeVisible();

    // taking the heart off removes the card at once; wait for the server before reloading
    const saved = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/favorites'));
    await page.getByRole('button', { name: /Убрать из избранного/ }).click();
    await expect(page.getByText(title)).toHaveCount(0);
    await expect(page.getByText('Wishlist пока пуст')).toBeVisible();
    await saved;
    await page.reload();
    await expect(page.getByText('Wishlist пока пуст')).toBeVisible();
  } finally {
    await getDb().delete(users).where(eq(users.telegramId, fanTelegramId));
    await cleanup();
  }
});

test('an artist sees the count on their own work but cannot like it', async ({ page }) => {
  const { artist, artworkId, cleanup } = await seedArtist('likes_own');
  try {
    await page.goto(`/auth/dev-login?id=${artist.telegramId}&name=Artist`);
    await page.goto(`/gallery/artwork/${artworkId}`);
    await expect(page.getByRole('img', { name: /Это ваша работа\. 0 лайков/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /избранное/ })).toHaveCount(0);
  } finally {
    await cleanup();
  }
});

test('favourites need a signed-in user', async ({ page }) => {
  await page.goto('/favorites');
  await expect(page).toHaveURL(/\/sign-in\?next=%2Ffavorites/, { timeout: 15000 });
});

test('the heart on a catalog card likes the work instead of opening it', async ({ page }) => {
  test.setTimeout(60_000);
  const { title, cleanup } = await seedArtist('likes_card_artist');
  const fan = await signInAsNewUser(page, 'likes_card_fan');
  try {
    await page.goto(`/gallery?q=${encodeURIComponent(title)}`);
    const heart = page.getByRole('button', { name: /Добавить в избранное/ });
    // nothing may sit on top of the heart (the card's stretched title link did)
    await heart.click({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/gallery\?q=/);
    await expect(page.getByRole('button', { name: /Убрать из избранного\. 1 лайк$/ })).toHaveAttribute('aria-pressed', 'true');
  } finally {
    await getDb().delete(users).where(eq(users.id, fan.id));
    await cleanup();
  }
});
