'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/src/db';
import { requireStaff } from '@/src/lib/auth/staff';
import { DbEditError, deleteRow, insertRow, isTableName, updateRow } from '@/src/lib/admin/db-editor';
import { IMAGE_COLUMNS, imageUrlsOf } from '@/src/lib/uploads/orphans';
import { listReferencedImageUrls } from '@/src/lib/uploads/references';
import { dropImages } from '@/src/lib/uploads/upload-image';

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
  let deleted: Record<string, unknown> | undefined;
  try {
    deleted = await deleteRow(getDb(), table, key);
  } catch (error) {
    const message = error instanceof DbEditError ? error.message : 'Не удалось удалить запись.';
    redirect(`${rowUrl(table, key)}&error=${encodeURIComponent(message)}`);
  }
  // The row's images go too, unless another row still shows the same file.
  const images = IMAGE_COLUMNS[table];
  const urls = deleted ? imageUrlsOf(table, [deleted]) : [];
  if (images && urls.length) {
    const inUse = new Set(await listReferencedImageUrls(getDb()));
    await dropImages(
      images.bucket,
      urls.filter((u) => !inUse.has(u)),
    );
  }
  revalidatePath('/', 'layout');
  redirect(`/admin/database/${table}?deleted=1`);
}
