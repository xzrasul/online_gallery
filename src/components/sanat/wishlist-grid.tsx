'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArtworkCard } from '@/src/components/artwork/artwork-card';
import type { CardArtwork } from '@/src/lib/gallery/types';
import type { LikeInfo } from '@/src/lib/likes/likes';
import { plural } from '@/src/lib/ru-format';
import { WISH_EVENT, type WishDetail } from '@/src/lib/wishlist/client';

// The wishlist: works the user liked. Taking the heart off removes the card
// straight away.
export function WishlistGrid({ saved, likes }: { saved: CardArtwork[]; likes: Record<string, LikeInfo> }) {
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const onWish = (e: Event) => {
      const { id, liked } = (e as CustomEvent<WishDetail>).detail;
      setRemoved((prev) => {
        const next = new Set(prev);
        if (liked) next.delete(id);
        else next.add(id);
        return next;
      });
    };
    window.addEventListener(WISH_EVENT, onWish);
    return () => window.removeEventListener(WISH_EVENT, onWish);
  }, []);

  const items = saved.filter((w) => !removed.has(w.id));

  return (
    <>
      <p className="count wish-count" aria-live="polite">
        {items.length} {plural(items.length, ['картина', 'картины', 'картин'])}
      </p>
      {items.length === 0 ? (
        <div className="empty">
          <h3>Wishlist пока пуст</h3>
          <p>Нажмите на сердечко на карточке картины, чтобы добавить её сюда.</p>
          <Link className="btn" href="/gallery">
            В каталог
          </Link>
        </div>
      ) : (
        <ul className="art-grid cards">
          {items.map((w) => (
            <li key={w.id}>
              <ArtworkCard artwork={w} like={likes[w.id]} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
