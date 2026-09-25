'use server';

import { requireStaff } from '@/src/lib/auth/staff';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/src/db';
import { approveOrRejectApplication } from '@/src/lib/sellers/applications';

export async function approveApplication(formData: FormData) {
  await requireStaff();
  const applicationIdRaw = formData.get('applicationId');
  if (typeof applicationIdRaw !== 'string' || !applicationIdRaw.trim()) {
    redirect('/admin/sellers');
  }
  await approveOrRejectApplication(getDb(), {
    applicationId: applicationIdRaw,
    adminUserId: null,
    decision: 'approve',
  });
  revalidatePath('/admin/sellers');
}

export async function rejectApplication(formData: FormData) {
  await requireStaff();
  const applicationIdRaw = formData.get('applicationId');
  if (typeof applicationIdRaw !== 'string' || !applicationIdRaw.trim()) {
    redirect('/admin/sellers');
  }
  await approveOrRejectApplication(getDb(), {
    applicationId: applicationIdRaw,
    adminUserId: null,
    decision: 'reject',
    reason: String(formData.get('reason') || ''),
  });
  revalidatePath('/admin/sellers');
}
