'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { approveOrRejectArtwork } from '@/src/lib/artworks/admin-operations';

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [admin] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!admin || admin.role !== 'admin') redirect('/');
  return admin;
}

export async function approveArtwork(formData: FormData) {
  const admin = await requireAdmin();
  const artworkId = String(formData.get('artworkId') ?? '').trim();
  if (!artworkId) redirect('/admin/artworks');
  await approveOrRejectArtwork(getDb(), { artworkId, adminUserId: admin.id, decision: 'approve' });
  revalidatePath('/admin/artworks');
}

export async function rejectArtwork(formData: FormData) {
  const admin = await requireAdmin();
  const artworkId = String(formData.get('artworkId') ?? '').trim();
  if (!artworkId) redirect('/admin/artworks');
  await approveOrRejectArtwork(getDb(), {
    artworkId,
    adminUserId: admin.id,
    decision: 'reject',
    reason: String(formData.get('reason') || ''),
  });
  revalidatePath('/admin/artworks');
}
