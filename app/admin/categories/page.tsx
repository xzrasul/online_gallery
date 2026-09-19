import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { listCategories } from '@/src/lib/catalog/categories';
import { addCategory, renameCategoryAction } from './actions';

export default async function AdminCategoriesPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [admin] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!admin || admin.role !== 'admin') redirect('/');

  const categories = await listCategories(getDb());

  return (
    <main>
      <h1>Категории картин</h1>
      <ul>
        {categories.map((category) => (
          <li key={category.id}>
            <form action={renameCategoryAction}>
              <input type="hidden" name="id" value={category.id} />
              <input type="text" name="name" defaultValue={category.name} />
              <button type="submit">Переименовать</button>
            </form>
          </li>
        ))}
      </ul>
      <form action={addCategory}>
        <input type="text" name="name" placeholder="Новая категория" required />
        <button type="submit">Добавить</button>
      </form>
    </main>
  );
}
