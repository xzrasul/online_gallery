import Image from 'next/image';
import Link from 'next/link';
import { LikeButton } from '@/src/components/likes/like-button';
import { techniqueAndYear } from '@/src/lib/artworks/year';
import { isStorageUrl } from '@/src/lib/uploads/buckets';
import type { CardArtwork } from '@/src/lib/gallery/types';
import type { LikeInfo } from '@/src/lib/likes/likes';

export type ArtworkCardData = CardArtwork;

// Where cards appear: grids (4 → 3 → 2 columns) and the home rail.
export const CARD_SIZES = '(min-width: 1240px) 300px, (min-width: 860px) 30vw, 50vw';
export const RAIL_CARD_SIZES = '(min-width: 1220px) 340px, (min-width: 640px) 28vw, 64vw';

// A pale square tile with the whole picture framed in the middle, the wishlist
// heart in its bottom right corner, and four lines under it: title, artist,
// "technique, year", price. The picture and the caption both open the artwork
// (the heart is a button, so the card itself can't be one link).
export function ArtworkCard({
  artwork,
  priority,
  like,
  sizes = CARD_SIZES,
}: {
  artwork: ArtworkCardData;
  priority?: boolean;
  like?: LikeInfo;
  sizes?: string;
}) {
  const href = `/gallery/artwork/${artwork.id}`;
  const era = techniqueAndYear(artwork.techniqueName, artwork.year);
  return (
    <article className="card">
      <div className="art">
        <Link href={href} tabIndex={-1} aria-hidden="true">
          <Image
            src={artwork.imageUrl}
            alt=""
            width={600}
            height={600}
            priority={priority}
            sizes={sizes}
            unoptimized={!isStorageUrl(artwork.imageUrl)}
            className="pic"
            draggable={false}
          />
        </Link>
        {artwork.status === 'sold' && <span className="badge sold">Продано</span>}
        {like && <LikeButton artworkId={artwork.id} info={like} />}
      </div>
      <Link href={href} className="meta">
        <h3>{artwork.title}</h3>
        {artwork.sellerDisplayName && <p className="by">{artwork.sellerDisplayName}</p>}
        {era && <p className="era">{era}</p>}
        <span className="price">{artwork.price} TJS</span>
      </Link>
    </article>
  );
}
