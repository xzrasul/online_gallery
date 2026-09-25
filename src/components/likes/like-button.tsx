'use client';

import Link from 'next/link';
import { useEffect, useOptimistic, useState, useTransition } from 'react';
import { setArtworkLike } from '@/src/lib/likes/actions';
import type { LikeInfo } from '@/src/lib/likes/likes';
import { plural } from '@/src/lib/ru-format';
import { cn } from '@/src/lib/utils';
import { emitWish } from '@/src/lib/wishlist/client';

const LIKES: [string, string, string] = ['лайк', 'лайка', 'лайков'];

// false in the server HTML and in the first client render, true once React has
// taken over the page (so both renders agree and hydration stays clean).
function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

export function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 20.5s-7.6-4.6-9.4-9.3C1.4 8 3.3 5 6.6 5c2 0 3.4 1.1 5.4 3.2C14 6.1 15.4 5 17.4 5c3.3 0 5.2 3 4 6.2-1.8 4.7-9.4 9.3-9.4 9.3z" />
    </svg>
  );
}

// The wishlist heart over an artwork picture. Guests are sent to sign in and
// brought back to the artwork; an artist sees their own work's heart but cannot
// like it. Clicks show at once and roll back if the server says no.
export function LikeButton({
  artworkId,
  info,
  size = 'card',
}: {
  artworkId: string;
  info: LikeInfo;
  size?: 'card' | 'big';
}) {
  const [committed, setCommitted] = useState({ liked: info.liked, count: info.count });
  const [shown, setShown] = useOptimistic(committed);
  const [pending, startTransition] = useTransition();
  const [popped, setPopped] = useState(0);
  // A click before the page is interactive would be lost silently; say so instead.
  const hydrated = useHydrated();

  const liked = shown.liked;
  const count = shown.count;
  const countLabel = `${count} ${plural(count, LIKES)}`;
  const className = cn('heart', size === 'big' && 'big', liked && 'on');

  if (info.state === 'guest') {
    return (
      <Link
        href={`/sign-in?why=wish&next=${encodeURIComponent(`/gallery/artwork/${artworkId}`)}`}
        className={className}
        aria-label={`Войдите, чтобы добавить в избранное. ${countLabel}`}
        title="Войдите, чтобы добавить в избранное"
      >
        <HeartIcon />
      </Link>
    );
  }

  if (info.state === 'own') {
    return (
      <span className={cn(className, 'own')} role="img" aria-label={`Это ваша работа. ${countLabel}`} title="Это ваша работа">
        <HeartIcon />
      </span>
    );
  }

  const toggle = () => {
    const next = !liked;
    if (next) setPopped((n) => n + 1);
    emitWish({ id: artworkId, liked: next });
    startTransition(async () => {
      setShown({ liked: next, count: Math.max(0, shown.count + (next ? 1 : -1)) });
      const result = await setArtworkLike(artworkId, next).catch(() => null);
      if (result?.ok) {
        setCommitted({ liked: result.liked, count: result.count });
        if (result.liked !== next) emitWish({ id: artworkId, liked: result.liked });
      } else {
        // the optimistic state falls back to the last committed one
        emitWish({ id: artworkId, liked: !next });
        if (result?.reason === 'sign_in') {
          window.location.assign(`/sign-in?why=wish&next=${encodeURIComponent(`/gallery/artwork/${artworkId}`)}`);
        }
      }
    });
  };

  return (
    <button
      type="button"
      className={className}
      aria-pressed={liked}
      aria-label={`${liked ? 'Убрать из избранного' : 'Добавить в избранное'}. ${countLabel}`}
      title={liked ? 'Убрать из Wishlist' : 'Добавить в Wishlist'}
      aria-busy={pending || undefined}
      aria-disabled={!hydrated || undefined}
      onClick={hydrated ? toggle : undefined}
    >
      <span className="heart-in" key={popped} data-pop={popped > 0 || undefined}>
        <HeartIcon />
      </span>
    </button>
  );
}
