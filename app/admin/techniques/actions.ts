'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { createTechnique, renameTechnique } from '@/src/lib/catalog/techniques';

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [admin] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!admin || admin.role !== 'admin') redirect('/');
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
