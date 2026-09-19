import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { getArtworkForOwner } from '@/src/lib/artworks/seller-operations';
import { listCategories } from '@/src/lib/catalog/categories';
import { listTechniques } from '@/src/lib/catalog/techniques';
import { ArtworkForm } from '@/src/components/artwork/artwork-form';
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
      <ArtworkForm
        action={submitWithId}
        categories={categories}
        techniques={techniques}
        submitLabel="Сохранить и отправить на модерацию"
        imageLabel="Новое фото (необязательно — оставьте пустым, чтобы сохранить текущее)"
        imageRequired={false}
        defaults={artwork}
        error={error}
      />
    </main>
  );
}
