'use client';

import { useEffect, useState } from 'react';
import { WISH_EVENT, type WishDetail } from '@/src/lib/wishlist/client';

// The wishlist badge: the server's count of liked works, kept current as
// hearts are clicked.
export function WishCount({ initial, signedIn }: { initial: number; signedIn: boolean }) {
  const [delta, setDelta] = useState(0);

  useEffect(() => {
    const onWish = (e: Event) => {
      const { liked } = (e as CustomEvent<WishDetail>).detail;
      setDelta((d) => d + (liked ? 1 : -1));
    };
    window.addEventListener(WISH_EVENT, onWish);
    return () => window.removeEventListener(WISH_EVENT, onWish);
  }, []);

  const n = signedIn ? Math.max(0, initial + delta) : 0;
  if (!n) return null;
  return (
    <span className="fav-count">
      <span className="sr-only">, в списке: </span>
      {n}
    </span>
  );
}
