'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/src/db';
import { requireStaff } from '@/src/lib/auth/staff';
import { DbEditError, deleteRow, insertRow, isTableName, updateRow } from '@/src/lib/admin/db-editor';

const rowUrl = (table: string, key: string, extra = '') => `/admin/database/${table}/row?key=${encodeURIComponent(key)}${extra}`;

// Create (no key) or update (key) one row of any table. Admin only.
export async function saveRow(formData: FormData) {
  await requireStaff('admin');
  const table = String(formData.get('table') ?? '');
  const key = formData.get('key');
  if (!isTableName(table)) redirect('/admin/database');

  let saved: string | undefined;
  try {
    saved =
      typeof key === 'string' && key
        ? await updateRow(getDb(), table, key, formData)
        : await insertRow(getDb(), table, formData);
  } catch (error) {
    const message = error instanceof DbEditError ? error.message : 'Не удалось сохранить запись.';
    const back = typeof key === 'string' && key ? rowUrl(table, key) : `/admin/database/${table}/row?new=1`;
    redirect(`${back}${back.includes('?') ? '&' : '?'}error=${encodeURIComponent(message)}`);
  }
  revalidatePath('/', 'layout');
  redirect(rowUrl(table, saved!, '&saved=1'));
}

export async function removeRow(formData: FormData) {
  await requireStaff('admin');
  const table = String(formData.get('table') ?? '');
  const key = String(formData.get('key') ?? '');
  if (!isTableName(table) || !key) redirect('/admin/database');
  try {
    await deleteRow(getDb(), table, key);
  } catch (error) {
    const message = error instanceof DbEditError ? error.message : 'Не удалось удалить запись.';
    redirect(`${rowUrl(table, key)}&error=${encodeURIComponent(message)}`);
  }
  revalidatePath('/', 'layout');
  redirect(`/admin/database/${table}?deleted=1`);
}
