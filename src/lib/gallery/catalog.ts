import type { Db } from '@/src/db';
import {
  countPublishedByCategory,
  listPublicArtists,
  listPublishedArtworks,
  type CatalogSort,
} from '@/src/lib/artworks/public-queries';
import type { CatalogParams } from '@/src/lib/catalog-href';
import { listCategories } from '@/src/lib/catalog/categories';
import { listTechniques } from '@/src/lib/catalog/techniques';
import { isUuid } from './types';

export type Option = { id: string; name: string };
export type CategoryOption = Option & { count: number };

export type CatalogOptions = {
  categories: CategoryOption[];
  techniques: Option[];
  artists: Option[];
};

const SORTS: CatalogSort[] = ['new', 'asc', 'desc', 'az'];
export const parseSort = (value: string | undefined): CatalogSort =>
  SORTS.includes(value as CatalogSort) ? (value as CatalogSort) : 'new';

// Everything the catalog's filter panel offers. Categories carry their work
// counts, empty ones included (0), so the full list is always there; artists
// with nothing on sale are left out.
export async function loadCatalogOptions(db: Db): Promise<CatalogOptions> {
  const [categories, techniques, counts, artists] = await Promise.all([
    listCategories(db),
    listTechniques(db),
    countPublishedByCategory(db),
    listPublicArtists(db),
  ]);
  return {
    categories: categories.map((c) => ({ id: c.id, name: c.name, count: counts.get(c.id) ?? 0 })),
    techniques: techniques.map((t) => ({ id: t.id, name: t.name })),
    artists: artists.filter((a) => a.works > 0).map((a) => ({ id: a.id, name: a.displayName })),
  };
}

function toNumber(value: string | undefined) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

// One page of the catalog: published works, filtered and sorted.
export async function searchCatalog(
  db: Db,
  params: CatalogParams,
  { page, pageSize }: { page: number; pageSize: number },
) {
  const { categoryId, techniqueId, artistId } = params;
  // ids from the URL go to the database only if they can be ids at all
  if ([categoryId, techniqueId, artistId].some((id) => id && !isUuid(id))) {
    return { items: [] as Awaited<ReturnType<typeof listPublishedArtworks>>['items'], total: 0 };
  }
  return listPublishedArtworks(
    db,
    {
      categoryId,
      techniqueId,
      sellerId: artistId,
      minPrice: toNumber(params.minPrice),
      maxPrice: toNumber(params.maxPrice),
      q: params.q?.trim(),
    },
    { page, pageSize },
    parseSort(params.sort),
  );
}

// "Ещё от художника": other works on sale by the same artist.
export async function moreByArtist(db: Db, artistId: string, exceptId: string, limit = 4) {
  const { items } = await listPublishedArtworks(db, { sellerId: artistId }, { page: 1, pageSize: limit + 1 });
  return items.filter((w) => w.id !== exceptId).slice(0, limit);
}
