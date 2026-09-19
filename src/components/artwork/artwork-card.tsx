import Link from 'next/link';
import { Badge } from '@/src/components/ui/badge';
import { ArtworkImage } from '@/src/components/artwork/artwork-image';

export type ArtworkCardData = {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  sellerDisplayName?: string;
  status?: string;
};

export function ArtworkCard({ artwork }: { artwork: ArtworkCardData }) {
  return (
    <Link href={`/gallery/artwork/${artwork.id}`} className="group block">
      <ArtworkImage
        src={artwork.imageUrl}
        alt={artwork.title}
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        className="transition-opacity group-hover:opacity-90"
      />
      <h3 className="mt-3 break-words text-sm font-medium leading-snug">{artwork.title}</h3>
      {artwork.sellerDisplayName && (
        <p className="break-words text-sm text-muted-foreground">{artwork.sellerDisplayName}</p>
      )}
      <p className="mt-1 text-sm font-semibold text-brand">{artwork.price} TJS</p>
      {artwork.status === 'sold' && (
        <Badge variant="secondary" className="mt-2">
          Продано
        </Badge>
      )}
    </Link>
  );
}
