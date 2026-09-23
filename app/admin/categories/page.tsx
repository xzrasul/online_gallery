import { getCurrentUser } from '@/src/lib/auth/session';
import { redirect } from 'next/navigation';
import { getDb } from '@/src/db';
import { listCategories } from '@/src/lib/catalog/categories';
import { AdminNav } from '@/src/components/admin/admin-nav';
import { ReferenceList } from '@/src/components/admin/reference-list';
import { addCategory, renameCategoryAction } from './actions';

export default async function AdminCategoriesPage() {
  const admin = await getCurrentUser();
  if (!admin) redirect('/sign-in');
  if (admin.role !== 'admin') redirect('/');

  const categories = await listCategories(getDb());

  return (
    <main>
      <AdminNav />
      <ReferenceList
        title="Категории картин"
        items={categories}
        renameAction={renameCategoryAction}
        addAction={addCategory}
        addPlaceholder="Новая категория"
      />
    </main>
  );
}
