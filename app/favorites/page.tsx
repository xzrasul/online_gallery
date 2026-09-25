import { redirect } from 'next/navigation';
import { getDb } from '@/src/db';
import { getCurrentUser } from '@/src/lib/auth/session';
import { likeInfoFor, listFavorites } from '@/src/lib/likes/likes';
import { WishlistGrid } from '@/src/components/sanat/wishlist-grid';

export const metadata = {
  title: 'Wishlist',
};

// Every artwork the signed-in user (buyer or artist) has liked, newest like first.
export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in?next=%2Ffavorites');

  const favourites = await listFavorites(getDb(), user.id);
  const likes = await likeInfoFor(getDb(), favourites, user.id);

  return (
    <main>
      <div className="wrap stack pg">
        <div className="head-row">
          <div>
            <h1 className="t">Wishlist</h1>
            <p className="fav-sub">Картины, которые вы отметили сердечком</p>
          </div>
        </div>
        <section className="sec wish" aria-label="Отмеченные картины">
          <WishlistGrid saved={favourites} likes={likes} />
        </section>
      </div>
    </main>
  );
}
