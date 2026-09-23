'use server';

import { getCurrentUser } from '@/src/lib/auth/session';
import { redirect } from 'next/navigation';
import { getDb } from '@/src/db';
import { getArtworkForOwner, updateArtwork } from '@/src/lib/artworks/seller-operations';
import { uploadArtworkImage } from '@/src/lib/uploads/upload-image';

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;

export async function submitEditArtwork(artworkId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  if (!user || user.role !== 'seller') redirect('/');

  const existing = await getArtworkForOwner(getDb(), { artworkId, sellerId: user.id });
  if (!existing) redirect('/dashboard/seller');

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const price = Number(formData.get('price'));
  const heightCm = Number(formData.get('heightCm'));
  const widthCm = Number(formData.get('widthCm'));
  const categoryId = String(formData.get('categoryId') ?? '').trim();
  const techniqueId = String(formData.get('techniqueId') ?? '').trim();
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
    !techniqueId
  ) {
    redirect(`/dashboard/seller/${artworkId}/edit?error=invalid`);
  }

  const imageUrl = image instanceof File && image.size > 0 ? await uploadArtworkImage(image) : existing.imageUrl;

  await updateArtwork(getDb(), {
    artworkId,
    sellerId: user.id,
    title,
    description,
    price,
    heightCm,
    widthCm,
    categoryId,
    techniqueId,
    imageUrl,
  });

  redirect('/dashboard/seller');
}
