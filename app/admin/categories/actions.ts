'use server';

import { getCurrentUser } from '@/src/lib/auth/session';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/src/db';
import { createCategory, renameCategory } from '@/src/lib/catalog/categories';

async function requireAdmin() {
  const admin = await getCurrentUser();
  if (!admin) redirect('/sign-in');
  if (admin.role !== 'admin') redirect('/');
  return admin;
}

export async function addCategory(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) redirect('/admin/categories');
  await createCategory(getDb(), name);
  revalidatePath('/admin/categories');
}

export async function renameCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  if (!id || !name) redirect('/admin/categories');
  await renameCategory(getDb(), { id, name });
  revalidatePath('/admin/categories');
}
