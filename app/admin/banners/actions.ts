'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireStaff } from '@/src/lib/auth/staff';
import { getDb } from '@/src/db';
import { isUuid } from '@/src/lib/gallery/types';
import { parseBannerForm } from '@/src/lib/home/banner-form';
import {
  createBanner,
  deleteBanner,
  getBanner,
  moveBanner,
  setBannerActive,
  updateBanner,
} from '@/src/lib/home/banners';
import { BANNERS_BUCKET } from '@/src/lib/uploads/buckets';
import { deleteImages, tryUploadImage } from '@/src/lib/uploads/upload-image';

// Banner images: desktop up to 1920px wide, the portrait phone version up to 1200px.
const DESKTOP_SIDE = 1920;
const MOBILE_SIDE = 1200;

function changed() {
  revalidateTag('banners');
  revalidatePath('/admin/banners');
  revalidatePath('/');
}

const fileOf = (form: FormData, key: string) => {
  const v = form.get(key);
  return v instanceof File && v.size > 0 ? v : null;
};

// Old images are removed only after the row points at the new ones; a failed
// delete just leaves an unused file behind.
async function dropImages(urls: (string | null | undefined)[]) {
  const list = urls.filter((u): u is string => Boolean(u));
  if (list.length) await deleteImages(BANNERS_BUCKET, list).catch((e) => console.error('banner image delete failed', e));
}

// Creates a banner, or updates the one named by the hidden `id` field.
export async function saveBanner(formData: FormData) {
  await requireStaff('admin');
  const id = String(formData.get('id') ?? '');
  const existing = id ? await getBanner(getDb(), id) : undefined;
  if (id && (!isUuid(id) || !existing)) redirect('/admin/banners?error=not_found');
  const back = existing ? `/admin/banners/${id}` : '/admin/banners/new';

  const parsed = parseBannerForm(formData);
  if (!parsed.ok) redirect(`${back}?error=${parsed.error}`);

  const desktop = fileOf(formData, 'image');
  const mobile = fileOf(formData, 'imageMobile');
  if (!desktop && !existing) redirect(`${back}?error=image`);

  const uploaded: string[] = [];
  let imageUrl = existing?.imageUrl ?? '';
  let imageMobileUrl = existing?.imageMobileUrl ?? null;
  if (desktop) {
    const up = await tryUploadImage(BANNERS_BUCKET, desktop, DESKTOP_SIDE);
    if (up.error !== undefined) redirect(`${back}?error=${up.error}`);
    imageUrl = up.url;
    uploaded.push(up.url);
  }
  if (mobile) {
    const up = await tryUploadImage(BANNERS_BUCKET, mobile, MOBILE_SIDE);
    if (up.error !== undefined) {
      await dropImages(uploaded);
      redirect(`${back}?error=${up.error}`);
    }
    imageMobileUrl = up.url;
    uploaded.push(up.url);
  }
  if (formData.get('removeMobile') === 'on' && !mobile) imageMobileUrl = null;

  const input = { ...parsed.fields, imageUrl, imageMobileUrl };
  const result = existing ? await updateBanner(getDb(), id, input) : await createBanner(getDb(), input);
  if (!result.ok) {
    await dropImages(uploaded);
    redirect(`${back}?error=${result.reason}`);
  }
  if (existing) {
    await dropImages([
      existing.imageUrl !== imageUrl ? existing.imageUrl : null,
      existing.imageMobileUrl !== imageMobileUrl ? existing.imageMobileUrl : null,
    ]);
  }
  changed();
  redirect('/admin/banners?saved=1');
}

export async function toggleBanner(formData: FormData) {
  await requireStaff('admin');
  const id = String(formData.get('id') ?? '');
  if (!isUuid(id)) return;
  const result = await setBannerActive(getDb(), id, formData.get('active') === '1');
  changed();
  if (!result.ok) redirect(`/admin/banners?error=${result.reason}`);
}

export async function moveBannerAction(formData: FormData) {
  await requireStaff('admin');
  const id = String(formData.get('id') ?? '');
  const dir = formData.get('dir') === 'up' ? -1 : 1;
  if (!isUuid(id)) return;
  await moveBanner(getDb(), id, dir);
  changed();
}

export async function removeBanner(formData: FormData) {
  await requireStaff('admin');
  const id = String(formData.get('id') ?? '');
  if (!isUuid(id)) return;
  const gone = await deleteBanner(getDb(), id);
  if (gone) await dropImages([gone.imageUrl, gone.imageMobileUrl]);
  changed();
}
