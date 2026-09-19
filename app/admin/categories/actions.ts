'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { createCategory, renameCategory } from '@/src/lib/catalog/categories';

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [admin] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!admin || admin.role !== 'admin') redirect('/');
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
