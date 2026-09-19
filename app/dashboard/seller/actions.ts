'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { markArtworkAsSold } from '@/src/lib/artworks/seller-operations';

export async function markAsSold(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [user] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!user || user.role !== 'seller') redirect('/');

  const artworkId = String(formData.get('artworkId') ?? '').trim();
  if (!artworkId) redirect('/dashboard/seller');

  await markArtworkAsSold(getDb(), { artworkId, sellerId: user.id });
  revalidatePath('/dashboard/seller');
}
