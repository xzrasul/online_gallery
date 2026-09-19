import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { getArtworkForOwner } from '@/src/lib/artworks/seller-operations';
import { listCategories } from '@/src/lib/catalog/categories';
import { listTechniques } from '@/src/lib/catalog/techniques';
import { submitEditArtwork } from './actions';

export default async function EditArtworkPage({
  params,
  searchParams,
}: {
  params: Promise<{ artworkId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [user] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!user || user.role !== 'seller') redirect('/');

  const { artworkId } = await params;
  const { error } = await searchParams;
  const artwork = await getArtworkForOwner(getDb(), { artworkId, sellerId: user.id });
  if (!artwork) redirect('/dashboard/seller');

  const [categories, techniques] = await Promise.all([
    listCategories(getDb()),
    listTechniques(getDb()),
  ]);

  const submitWithId = submitEditArtwork.bind(null, artworkId);

  return (
    <main>
      <h1>Редактировать картину</h1>
      {error === 'invalid' && <p role="alert">Проверьте, что все поля заполнены корректно.</p>}
      <form action={submitWithId}>
        <label>
          Название
          <input type="text" name="title" defaultValue={artwork.title} required />
        </label>
        <label>
          Описание
          <textarea name="description" defaultValue={artwork.description} required />
        </label>
        <label>
          Цена (сомони)
          <input type="number" name="price" min="1" defaultValue={artwork.price} required />
        </label>
        <label>
          Высота (см)
          <input type="number" name="heightCm" min="1" defaultValue={artwork.heightCm} required />
        </label>
        <label>
          Ширина (см)
          <input type="number" name="widthCm" min="1" defaultValue={artwork.widthCm} required />
        </label>
        <label>
          Категория
          <select name="categoryId" defaultValue={artwork.categoryId} required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Техника
          <select name="techniqueId" defaultValue={artwork.techniqueId} required>
            {techniques.map((technique) => (
              <option key={technique.id} value={technique.id}>
                {technique.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Новое фото (необязательно — оставьте пустым, чтобы сохранить текущее)
          <input type="file" name="image" accept="image/*" />
        </label>
        <button type="submit">Сохранить и отправить на модерацию</button>
      </form>
    </main>
  );
}
