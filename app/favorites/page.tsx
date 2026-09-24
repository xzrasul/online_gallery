import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDb } from '@/src/db';
import { ArtworkGrid } from '@/src/components/artwork/artwork-grid';
import { getCurrentUser } from '@/src/lib/auth/session';
import { likeInfoFor, listFavorites } from '@/src/lib/likes/likes';
import { plural } from '@/src/lib/ru-format';

export const metadata = {
  title: 'Избранное',
};

// Every artwork the signed-in user (buyer or artist) has liked, newest like first.
export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in?next=%2Ffavorites');

  const favourites = await listFavorites(getDb(), user.id);
  const likes = await likeInfoFor(getDb(), favourites, user.id);

  return (
    <main className="stack favorites">
      <div>
        <h1 className="t">Избранное</h1>
        <p className="muted">
          {favourites.length > 0
            ? `${favourites.length} ${plural(favourites.length, ['картина', 'картины', 'картин'])}, которые вам понравились.`
            : 'Здесь будут картины, которые вам понравились.'}
        </p>
      </div>
      <section className="panel" aria-label="Понравившиеся картины">
        {favourites.length === 0 ? (
          <p className="empty">
            Отмечайте сердцем картины в{' '}
            <Link href="/gallery" className="more">
              каталоге
            </Link>
            , и они появятся здесь.
          </p>
        ) : (
          <ArtworkGrid artworks={favourites} likes={likes} />
        )}
      </section>
    </main>
  );
}
