import Image from 'next/image';
import Link from 'next/link';
import { LikeButton } from '@/src/components/likes/like-button';
import type { CardArtwork } from '@/src/lib/gallery/types';
import type { LikeInfo } from '@/src/lib/likes/likes';

export type ArtworkCardData = CardArtwork;

// One rounded block: the picture and the text under it share the card's inner
// padding. The whole card opens the artwork (the title link is stretched over
// it: a link can't contain the heart button, so the card itself is not a link).
export function ArtworkCard({
  artwork,
  priority,
  like,
}: {
  artwork: ArtworkCardData;
  priority?: boolean;
  like?: LikeInfo;
}) {
  const href = `/gallery/artwork/${artwork.id}`;
  return (
    <article className="card">
      <div className="art">
        <Image
          src={artwork.imageUrl}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1200px) 290px, (min-width: 860px) 31vw, 50vw"
          unoptimized
          className="pic"
          style={artwork.focus ? { objectPosition: artwork.focus } : undefined}
          draggable={false}
        />
        {artwork.status === 'sold' ? (
          <span className="badge sold">Продано</span>
        ) : (
          artwork.mock && <span className="badge">макет</span>
        )}
        {like && <LikeButton artworkId={artwork.id} info={like} local={artwork.mock} />}
      </div>
      <div className="meta">
        <h3 title={artwork.title}>
          <Link href={href} className="card-link">
            {artwork.title}
          </Link>
        </h3>
        <div className="mrow">
          {artwork.sellerDisplayName && <p className="by">{artwork.sellerDisplayName}</p>}
          <span className="price">{artwork.price} TJS</span>
        </div>
      </div>
    </article>
  );
}
