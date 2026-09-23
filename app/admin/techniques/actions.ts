'use server';

import { getCurrentUser } from '@/src/lib/auth/session';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/src/db';
import { createTechnique, renameTechnique } from '@/src/lib/catalog/techniques';

async function requireAdmin() {
  const admin = await getCurrentUser();
  if (!admin) redirect('/sign-in');
  if (admin.role !== 'admin') redirect('/');
  return admin;
}

export async function addTechnique(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) redirect('/admin/techniques');
  await createTechnique(getDb(), name);
  revalidatePath('/admin/techniques');
}

export async function renameTechniqueAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  if (!id || !name) redirect('/admin/techniques');
  await renameTechnique(getDb(), { id, name });
  revalidatePath('/admin/techniques');
}
