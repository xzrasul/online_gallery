'use client';

import { useEffect, useState } from 'react';
import { useLocalWishlist, WISH_EVENT, type WishDetail } from '@/src/lib/wishlist/client';

// The wishlist badge: the server's count of liked works, plus the showcase
// works hearted in this browser, kept current as hearts are clicked.
export function WishCount({ initial, signedIn }: { initial: number; signedIn: boolean }) {
  const [delta, setDelta] = useState(0);
  const local = useLocalWishlist();

  useEffect(() => {
    const onWish = (e: Event) => {
      const { id, liked } = (e as CustomEvent<WishDetail>).detail;
      // showcase hearts are already counted through `local`
      if (/^[0-9a-f-]{36}$/i.test(id)) setDelta((d) => d + (liked ? 1 : -1));
    };
    window.addEventListener(WISH_EVENT, onWish);
    return () => window.removeEventListener(WISH_EVENT, onWish);
  }, []);

  const n = signedIn ? Math.max(0, initial + delta + local.length) : 0;
  if (!n) return null;
  return (
    <span className="fav-count">
      <span className="sr-only">, в списке: </span>
      {n}
    </span>
  );
}
