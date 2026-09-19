import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { listCategories } from '@/src/lib/catalog/categories';
import { listTechniques } from '@/src/lib/catalog/techniques';
import { submitNewArtwork } from './actions';

export default async function NewArtworkPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [user] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!user || user.role !== 'seller') redirect('/');

  const { error } = await searchParams;
  const [categories, techniques] = await Promise.all([
    listCategories(getDb()),
    listTechniques(getDb()),
  ]);

  return (
    <main>
      <h1>Добавить картину</h1>
      {error === 'invalid' && <p role="alert">Проверьте, что все поля заполнены корректно.</p>}
      <form action={submitNewArtwork}>
        <label>
          Название
          <input type="text" name="title" required />
        </label>
        <label>
          Описание
          <textarea name="description" required />
        </label>
        <label>
          Цена (сомони)
          <input type="number" name="price" min="1" required />
        </label>
        <label>
          Высота (см)
          <input type="number" name="heightCm" min="1" required />
        </label>
        <label>
          Ширина (см)
          <input type="number" name="widthCm" min="1" required />
        </label>
        <label>
          Категория
          <select name="categoryId" required>
            <option value="">Выберите категорию</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Техника
          <select name="techniqueId" required>
            <option value="">Выберите технику</option>
            {techniques.map((technique) => (
              <option key={technique.id} value={technique.id}>
                {technique.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Фото
          <input type="file" name="image" accept="image/*" required />
        </label>
        <button type="submit">Отправить на модерацию</button>
      </form>
    </main>
  );
}
