'use server';

import { getCurrentUser } from '@/src/lib/auth/session';
import { redirect } from 'next/navigation';
import { getDb } from '@/src/db';
import { createArtwork } from '@/src/lib/artworks/seller-operations';
import { tryUploadArtworkImage } from '@/src/lib/uploads/upload-image';
import { parseYear } from '@/src/lib/artworks/year';

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;

export async function submitNewArtwork(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  if (!user || user.role !== 'seller') redirect('/');

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const price = Number(formData.get('price'));
  const heightCm = Number(formData.get('heightCm'));
  const widthCm = Number(formData.get('widthCm'));
  const categoryId = String(formData.get('categoryId') ?? '').trim();
  const techniqueId = String(formData.get('techniqueId') ?? '').trim();
  const year = parseYear(formData.get('year'));
  const image = formData.get('image');

  const validNumbers =
    Number.isFinite(price) && price > 0 && Number.isFinite(heightCm) && heightCm > 0 && Number.isFinite(widthCm) && widthCm > 0;

  if (
    !title ||
    !description ||
    title.length > MAX_TITLE_LENGTH ||
    description.length > MAX_DESCRIPTION_LENGTH ||
    !validNumbers ||
    !categoryId ||
    !techniqueId ||
    year === undefined ||
    !(image instanceof File) ||
    image.size === 0
  ) {
    redirect('/dashboard/seller/new?error=invalid');
  }

  const upload = await tryUploadArtworkImage(image as File);
  if (upload.error !== undefined) redirect(`/dashboard/seller/new?error=${upload.error}`);

  await createArtwork(getDb(), {
    sellerId: user.id,
    title,
    description,
    price,
    heightCm,
    widthCm,
    categoryId,
    techniqueId,
    imageUrl: upload.url,
    widthPx: upload.width,
    heightPx: upload.height,
    year,
  });

  redirect('/dashboard/seller');
}
