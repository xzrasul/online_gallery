'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { createArtwork } from '@/src/lib/artworks/seller-operations';
import { uploadArtworkImage } from '@/src/lib/uploads/upload-image';

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;

export async function submitNewArtwork(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [user] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!user || user.role !== 'seller') redirect('/');

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
    !techniqueId ||
    !(image instanceof File) ||
    image.size === 0
  ) {
    redirect('/dashboard/seller/new?error=invalid');
  }

  const imageUrl = await uploadArtworkImage(image as File);

  await createArtwork(getDb(), {
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
