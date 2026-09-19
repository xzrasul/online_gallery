import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { listCategories } from '@/src/lib/catalog/categories';
import { AdminNav } from '@/src/components/admin/admin-nav';
import { ReferenceList } from '@/src/components/admin/reference-list';
import { addCategory, renameCategoryAction } from './actions';

export default async function AdminCategoriesPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [admin] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!admin || admin.role !== 'admin') redirect('/');

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
