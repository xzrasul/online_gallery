import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { listPendingArtworks } from '@/src/lib/artworks/admin-operations';
import { approveArtwork, rejectArtwork } from './actions';

export default async function AdminArtworksPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [admin] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!admin || admin.role !== 'admin') redirect('/');

  const pending = await listPendingArtworks(getDb());

  return (
    <main>
      <h1>Картины на модерации</h1>
      {pending.length === 0 && <p>Нет картин на модерации.</p>}
      {pending.map((artwork) => (
        <section key={artwork.id}>
          <img src={artwork.imageUrl} alt={artwork.title} width={200} />
          <h2>{artwork.title}</h2>
          <p>{artwork.description}</p>
          <p>
            {artwork.price} TJS · {artwork.heightCm}×{artwork.widthCm} см
          </p>
          <p>
            {artwork.categoryName} · {artwork.techniqueName}
          </p>
          <p>Художник: {artwork.sellerDisplayName}</p>
          <form action={approveArtwork}>
            <input type="hidden" name="artworkId" value={artwork.id} />
            <button type="submit">Одобрить</button>
          </form>
          <form action={rejectArtwork}>
            <input type="hidden" name="artworkId" value={artwork.id} />
            <input type="text" name="reason" placeholder="Причина отказа" />
            <button type="submit">Отклонить</button>
          </form>
        </section>
      ))}
    </main>
  );
}
