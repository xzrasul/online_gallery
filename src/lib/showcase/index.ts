import type { CardArtwork } from '@/src/lib/gallery/types';
import {
  SHOWCASE_ARTISTS,
  SHOWCASE_ARTWORKS,
  SHOWCASE_COLLAGE,
  SHOWCASE_ENABLED,
  type ShowcaseArtist,
  type ShowcaseArtwork,
} from './data';

export { SHOWCASE_ENABLED, type ShowcaseArtist, type ShowcaseArtwork };

export const showcaseArtists = SHOWCASE_ENABLED ? SHOWCASE_ARTISTS : [];
export const showcaseArtworks = SHOWCASE_ENABLED ? SHOWCASE_ARTWORKS : [];

export const showcaseArtist = (id: string) => showcaseArtists.find((a) => a.id === id);
export const showcaseArtwork = (id: string) => showcaseArtworks.find((w) => w.id === id);
export const showcaseWorksOf = (artistId: string) => showcaseArtworks.filter((w) => w.artistId === artistId);

// Showcase categories and techniques have their own ids, prefixed so they can
// never be mistaken for (or sent to the database as) a real uuid.
const SLUGS: Record<string, string> = {
  Портрет: 'portrait',
  Пейзаж: 'landscape',
  Море: 'sea',
  Ночь: 'night',
  Сюжет: 'story',
  Натюрморт: 'still-life',
  Масло: 'oil',
  Темпера: 'tempera',
  Гравюра: 'print',
};
export const showcaseTermId = (name: string) => `sc-${SLUGS[name] ?? encodeURIComponent(name.toLowerCase())}`;

const unique = (names: string[]) => Array.from(new Set(names));
export const showcaseCategories = () => unique(showcaseArtworks.map((w) => w.category));
export const showcaseTechniques = () => unique(showcaseArtworks.map((w) => w.technique));

/** Small copy for cards and the collage; the full one for the artwork page. */
export const showcaseImage = (w: ShowcaseArtwork, full = false) => `/showcase/${w.id}${full ? '' : '-sm'}.webp`;

export function showcaseCard(w: ShowcaseArtwork): CardArtwork {
  return {
    id: w.id,
    title: w.title,
    price: w.price,
    imageUrl: showcaseImage(w),
    sellerId: w.artistId,
    sellerDisplayName: showcaseArtist(w.artistId)?.name ?? '',
    status: 'published',
    mock: true,
    focus: w.focus,
  };
}

export const showcaseCollage = () =>
  SHOWCASE_COLLAGE.map((id) => showcaseArtwork(id)).filter((w): w is ShowcaseArtwork => Boolean(w));
