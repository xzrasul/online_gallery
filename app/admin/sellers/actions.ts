'use server';

import { getCurrentUser } from '@/src/lib/auth/session';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/src/db';
import { approveOrRejectApplication } from '@/src/lib/sellers/applications';

async function requireAdmin() {
  const admin = await getCurrentUser();
  if (!admin) redirect('/sign-in');
  if (admin.role !== 'admin') redirect('/');
  return admin;
}

export async function approveApplication(formData: FormData) {
  const admin = await requireAdmin();
  const applicationIdRaw = formData.get('applicationId');
  if (typeof applicationIdRaw !== 'string' || !applicationIdRaw.trim()) {
    redirect('/admin/sellers');
  }
  await approveOrRejectApplication(getDb(), {
    applicationId: applicationIdRaw,
    adminUserId: admin.id,
    decision: 'approve',
  });
  revalidatePath('/admin/sellers');
}

export async function rejectApplication(formData: FormData) {
  const admin = await requireAdmin();
  const applicationIdRaw = formData.get('applicationId');
  if (typeof applicationIdRaw !== 'string' || !applicationIdRaw.trim()) {
    redirect('/admin/sellers');
  }
  await approveOrRejectApplication(getDb(), {
    applicationId: applicationIdRaw,
    adminUserId: admin.id,
    decision: 'reject',
    reason: String(formData.get('reason') || ''),
  });
  revalidatePath('/admin/sellers');
}
