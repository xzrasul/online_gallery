import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { listArtworksForSeller } from '@/src/lib/artworks/seller-operations';
import { markAsSold } from './actions';

const STATUS_LABELS: Record<string, string> = {
  pending: 'На модерации',
  published: 'Опубликована',
  rejected: 'Отклонена',
  sold: 'Продана',
};

export default async function SellerDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [user] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!user || user.role !== 'seller') redirect('/');

  const myArtworks = await listArtworksForSeller(getDb(), user.id);

  return (
    <main>
      <h1>Личный кабинет продавца</h1>
      <h2>Мои картины</h2>
      {myArtworks.length === 0 && <p>У вас пока нет картин.</p>}
      {myArtworks.map((artwork) => (
        <section key={artwork.id}>
          <h3>{artwork.title}</h3>
          <p>Статус: {STATUS_LABELS[artwork.status]}</p>
          {artwork.status === 'rejected' && <p>Причина отказа: {artwork.rejectionReason}</p>}
          <a href={`/dashboard/seller/${artwork.id}/edit`}>Редактировать</a>
          {artwork.status === 'published' && (
            <form action={markAsSold}>
              <input type="hidden" name="artworkId" value={artwork.id} />
              <button type="submit">Отметить как продано</button>
            </form>
          )}
        </section>
      ))}
      <a href="/dashboard/seller/new">Добавить картину</a>
    </main>
  );
}
