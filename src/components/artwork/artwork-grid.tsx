import { ArtworkCard, type ArtworkCardData } from '@/src/components/artwork/artwork-card';

export function ArtworkGrid({ artworks }: { artworks: ArtworkCardData[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {artworks.map((artwork) => (
        <li key={artwork.id}>
          <ArtworkCard artwork={artwork} />
        </li>
      ))}
    </ul>
  );
}
