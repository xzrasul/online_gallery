import { and, asc, count, desc, eq, gt, isNull, lte, or, sql } from 'drizzle-orm';
import type { Db } from '../../db';
import { banners } from '../../db/schema';

export const MAX_ACTIVE_BANNERS = 8;

export type Banner = typeof banners.$inferSelect;

// One slide as the home page hero draws it.
export type HeroSlide = {
  id: string;
  imageUrl: string;
  imageMobileUrl: string | null;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  overlay: number;
  buttons: { label: string; href: string }[];
};

// A banner's buttons: the first one opens the linked artwork when there is one.
export function slideOf(b: Banner): HeroSlide {
  const buttons: HeroSlide['buttons'] = [];
  const firstHref = b.artworkId ? `/gallery/artwork/${b.artworkId}` : b.buttonUrl;
  if (firstHref) buttons.push({ label: b.buttonLabel || 'Смотреть картину', href: firstHref });
  if (b.button2Label && b.button2Url) buttons.push({ label: b.button2Label, href: b.button2Url });
  return {
    id: b.id,
    imageUrl: b.imageUrl,
    imageMobileUrl: b.imageMobileUrl,
    eyebrow: b.eyebrow,
    title: b.title,
    subtitle: b.subtitle,
    overlay: b.overlay,
    buttons,
  };
}

// What the public sees: active banners inside their show window, in order.
export async function listLiveBanners(db: Db, now = new Date()): Promise<HeroSlide[]> {
  const rows = await db
    .select()
    .from(banners)
    .where(
      and(
        eq(banners.isActive, true),
        or(isNull(banners.startsAt), lte(banners.startsAt, now)),
        or(isNull(banners.endsAt), gt(banners.endsAt, now)),
      ),
    )
    .orderBy(asc(banners.sortOrder), asc(banners.createdAt))
    .limit(MAX_ACTIVE_BANNERS);
  return rows.map(slideOf);
}

export async function listAllBanners(db: Db): Promise<Banner[]> {
  return db.select().from(banners).orderBy(asc(banners.sortOrder), asc(banners.createdAt));
}

export async function getBanner(db: Db, id: string): Promise<Banner | undefined> {
  const [row] = await db.select().from(banners).where(eq(banners.id, id));
  return row;
}

async function countActive(db: Db, exceptId?: string) {
  const where = exceptId
    ? and(eq(banners.isActive, true), sql`${banners.id} <> ${exceptId}`)
    : eq(banners.isActive, true);
  const [row] = await db.select({ n: count() }).from(banners).where(where);
  return row?.n ?? 0;
}

export type BannerInput = Omit<Banner, 'id' | 'createdAt' | 'sortOrder'>;

export type SaveResult = { ok: true; id: string } | { ok: false; reason: 'too_many_active' | 'not_found' };

// New banners go to the end of the list.
export async function createBanner(db: Db, input: BannerInput): Promise<SaveResult> {
  if (input.isActive && (await countActive(db)) >= MAX_ACTIVE_BANNERS) return { ok: false, reason: 'too_many_active' };
  const [last] = await db.select({ n: banners.sortOrder }).from(banners).orderBy(desc(banners.sortOrder)).limit(1);
  const [row] = await db
    .insert(banners)
    .values({ ...input, sortOrder: (last?.n ?? -1) + 1 })
    .returning({ id: banners.id });
  return { ok: true, id: row.id };
}

export async function updateBanner(db: Db, id: string, input: BannerInput): Promise<SaveResult> {
  if (input.isActive && (await countActive(db, id)) >= MAX_ACTIVE_BANNERS) return { ok: false, reason: 'too_many_active' };
  const rows = await db.update(banners).set(input).where(eq(banners.id, id)).returning({ id: banners.id });
  return rows.length ? { ok: true, id } : { ok: false, reason: 'not_found' };
}

export async function setBannerActive(db: Db, id: string, active: boolean): Promise<SaveResult> {
  if (active && (await countActive(db, id)) >= MAX_ACTIVE_BANNERS) return { ok: false, reason: 'too_many_active' };
  const rows = await db.update(banners).set({ isActive: active }).where(eq(banners.id, id)).returning({ id: banners.id });
  return rows.length ? { ok: true, id } : { ok: false, reason: 'not_found' };
}

// Swaps the banner with its neighbour above (-1) or below (+1). The list is
// renumbered 0..n-1 first, so equal or missing sort values can't get stuck.
export async function moveBanner(db: Db, id: string, dir: -1 | 1): Promise<void> {
  await db.transaction(async (tx) => {
    const list = await tx
      .select({ id: banners.id })
      .from(banners)
      .orderBy(asc(banners.sortOrder), asc(banners.createdAt));
    const i = list.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    for (const [n, b] of list.entries()) await tx.update(banners).set({ sortOrder: n }).where(eq(banners.id, b.id));
  });
}

export async function deleteBanner(db: Db, id: string): Promise<Banner | undefined> {
  const [row] = await db.delete(banners).where(eq(banners.id, id)).returning();
  return row;
}
