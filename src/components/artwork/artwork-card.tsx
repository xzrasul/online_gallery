import Image from 'next/image';
import Link from 'next/link';
import { LikeButton } from '@/src/components/likes/like-button';
import type { LikeInfo } from '@/src/lib/likes/likes';

export type ArtworkCardData = {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  sellerDisplayName?: string;
  status?: string;
};

// The whole card opens the artwork: the title link is stretched over it (a
// link can't contain the like button, so the card itself is not a link).
export function ArtworkCard({
  artwork,
  priority,
  like,
}: {
  artwork: ArtworkCardData;
  priority?: boolean;
  like?: LikeInfo;
}) {
  return (
    <div className="card">
      <div className="art">
        <Image
          src={artwork.imageUrl}
          alt={artwork.title}
          fill
          priority={priority}
          sizes="(min-width: 1200px) 360px, (min-width: 700px) 45vw, 100vw"
          unoptimized
          className="pic"
        />
        {artwork.status === 'sold' && <span className="tag">Продано</span>}
      </div>
      <div className="meta">
        <div>
          <h3>
            <Link href={`/gallery/artwork/${artwork.id}`} className="card-link">
              {artwork.title}
            </Link>
          </h3>
          {artwork.sellerDisplayName && <p className="by">{artwork.sellerDisplayName}</p>}
        </div>
        <span className="price">{artwork.price} TJS</span>
      </div>
      {like && (
        <div className="card-like">
          <LikeButton artworkId={artwork.id} info={like} />
        </div>
      )}
    </div>
  );
}
