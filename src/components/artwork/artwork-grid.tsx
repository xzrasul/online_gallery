import { ArtworkCard, type ArtworkCardData } from '@/src/components/artwork/artwork-card';
import { RevealCards } from '@/src/components/sanat/reveal-cards';

// `priorityCount`: how many leading images load eagerly (above-the-fold grids).
export function ArtworkGrid({
  artworks,
  revealBase,
  priorityCount = 0,
}: {
  artworks: ArtworkCardData[];
  revealBase?: number;
  priorityCount?: number;
}) {
  return (
    <RevealCards base={revealBase}>
      {artworks.map((artwork, i) => (
        <li key={artwork.id}>
          <ArtworkCard artwork={artwork} priority={i < priorityCount} />
        </li>
      ))}
    </RevealCards>
  );
}
