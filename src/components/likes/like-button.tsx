'use client';

import Link from 'next/link';
import { useEffect, useOptimistic, useState, useTransition } from 'react';
import { setArtworkLike } from '@/src/lib/likes/actions';
import type { LikeInfo } from '@/src/lib/likes/likes';
import { plural } from '@/src/lib/ru-format';
import { cn } from '@/src/lib/utils';

const LIKES: [string, string, string] = ['лайк', 'лайка', 'лайков'];

// false in the server HTML and in the first client render, true once React has
// taken over the page (so both renders agree and hydration stays clean).
function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

function Heart() {
  return (
    <svg className="heart" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 20.3 4.9 13.5a4.6 4.6 0 0 1 6.5-6.6l.6.6.6-.6a4.6 4.6 0 0 1 6.5 6.6Z" />
    </svg>
  );
}

// The heart with its count. Guests are sent to sign in and brought back to the
// artwork; an artist sees the count on their own work but cannot like it.
// Clicks show at once and roll back if the server says no.
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
  const countLabel = `${shown.count} ${plural(shown.count, LIKES)}`;
  const className = cn('like', size === 'big' && 'big', shown.liked && 'on');

  if (info.state === 'guest') {
    return (
      <Link
        href={`/sign-in?next=${encodeURIComponent(`/gallery/artwork/${artworkId}`)}`}
        className={className}
        aria-label={`Войдите, чтобы добавить в избранное. ${countLabel}`}
        title="Войдите, чтобы добавить в избранное"
      >
        <Heart />
        <span className="like-n">{shown.count}</span>
      </Link>
    );
  }

  if (info.state === 'own') {
    return (
      <span className={cn(className, 'own')} role="img" aria-label={`Это ваша работа. ${countLabel}`} title="Это ваша работа">
        <Heart />
        <span className="like-n">{shown.count}</span>
      </span>
    );
  }

  const toggle = () => {
    const next = !shown.liked;
    if (next) setPopped((n) => n + 1);
    startTransition(async () => {
      setShown({ liked: next, count: Math.max(0, shown.count + (next ? 1 : -1)) });
      const result = await setArtworkLike(artworkId, next).catch(() => null);
      if (result?.ok) setCommitted({ liked: result.liked, count: result.count });
      else if (result?.reason === 'sign_in') {
        window.location.assign(`/sign-in?next=${encodeURIComponent(`/gallery/artwork/${artworkId}`)}`);
      }
      // anything else: the optimistic state falls back to the last committed one
    });
  };

  return (
    <button
      type="button"
      className={className}
      aria-pressed={shown.liked}
      aria-label={`${shown.liked ? 'Убрать из избранного' : 'Добавить в избранное'}. ${countLabel}`}
      title={shown.liked ? 'Убрать из избранного' : 'Добавить в избранное'}
      aria-busy={pending || undefined}
      aria-disabled={!hydrated || undefined}
      onClick={hydrated ? toggle : undefined}
    >
      <span className="heart-wrap" key={popped} data-pop={popped > 0 || undefined}>
        <Heart />
      </span>
      <span className="like-n">{shown.count}</span>
    </button>
  );
}
