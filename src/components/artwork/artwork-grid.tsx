import { ArtworkCard, type ArtworkCardData } from '@/src/components/artwork/artwork-card';
import { RevealCards } from '@/src/components/sanat/reveal-cards';
import type { LikeInfo } from '@/src/lib/likes/likes';

// `priorityCount`: how many leading images load eagerly (above-the-fold grids).
// `likes`: like-button state per artwork id (see likeInfoFor); no hearts without it.
export function ArtworkGrid({
  artworks,
  revealBase,
  priorityCount = 0,
  likes,
}: {
  artworks: ArtworkCardData[];
  revealBase?: number;
  priorityCount?: number;
  likes?: Record<string, LikeInfo>;
}) {
  return (
    <RevealCards base={revealBase}>
      {artworks.map((artwork, i) => (
        <li key={artwork.id}>
          <ArtworkCard artwork={artwork} priority={i < priorityCount} like={likes?.[artwork.id]} />
        </li>
      ))}
    </RevealCards>
  );
}
