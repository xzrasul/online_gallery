'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { approveOrRejectApplication } from '@/src/lib/sellers/applications';

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [admin] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!admin || admin.role !== 'admin') redirect('/');
  return admin;
}

export async function approveApplication(formData: FormData) {
  const admin = await requireAdmin();
  await approveOrRejectApplication(getDb(), {
    applicationId: String(formData.get('applicationId')),
    adminUserId: admin.id,
    decision: 'approve',
  });
  revalidatePath('/admin/sellers');
}

export async function rejectApplication(formData: FormData) {
  const admin = await requireAdmin();
  await approveOrRejectApplication(getDb(), {
    applicationId: String(formData.get('applicationId')),
    adminUserId: admin.id,
    decision: 'reject',
    reason: String(formData.get('reason') || ''),
  });
  revalidatePath('/admin/sellers');
}
