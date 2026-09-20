import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { listCategories } from '@/src/lib/catalog/categories';
import { listTechniques } from '@/src/lib/catalog/techniques';
import { ArtworkForm } from '@/src/components/artwork/artwork-form';
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
      <ArtworkForm
        action={submitNewArtwork}
        categories={categories}
        techniques={techniques}
        submitLabel="Отправить на модерацию"
        imageLabel="Фото"
        imageRequired
        error={error}
      />
    </main>
  );
}
