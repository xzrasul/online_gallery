import Image from 'next/image';
import Link from 'next/link';

export type ArtworkCardData = {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  sellerDisplayName?: string;
  status?: string;
};

export function ArtworkCard({ artwork, priority }: { artwork: ArtworkCardData; priority?: boolean }) {
  return (
    <Link href={`/gallery/artwork/${artwork.id}`} className="card">
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
          <h3>{artwork.title}</h3>
          {artwork.sellerDisplayName && <p className="by">{artwork.sellerDisplayName}</p>}
        </div>
        <span className="price">{artwork.price} TJS</span>
      </div>
    </Link>
  );
}
