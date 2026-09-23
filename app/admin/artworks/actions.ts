'use server';

import { getCurrentUser } from '@/src/lib/auth/session';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/src/db';
import { approveOrRejectArtwork } from '@/src/lib/artworks/admin-operations';

async function requireAdmin() {
  const admin = await getCurrentUser();
  if (!admin) redirect('/sign-in');
  if (admin.role !== 'admin') redirect('/');
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
