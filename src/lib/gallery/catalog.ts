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
import {
  showcaseArtist,
  showcaseArtists,
  showcaseArtworks,
  showcaseCard,
  showcaseCategories,
  showcaseTechniques,
  showcaseTermId,
  showcaseWorksOf,
  type ShowcaseArtwork,
} from '@/src/lib/showcase';
import { isUuid, type CardArtwork } from './types';

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

const byName = (list: Option[]) => new Map(list.map((o) => [o.name.toLowerCase(), o.id]));

// A showcase work's category/technique id: the real one when the database has
// a term with the same name (so one chip covers both), else its own sc- id.
function termIds(categories: Option[], techniques: Option[]) {
  const cats = byName(categories);
  const techs = byName(techniques);
  return {
    category: (w: ShowcaseArtwork) => cats.get(w.category.toLowerCase()) ?? showcaseTermId(w.category),
    technique: (w: ShowcaseArtwork) => techs.get(w.technique.toLowerCase()) ?? showcaseTermId(w.technique),
  };
}

// Everything the catalog's filter panel offers: real categories, techniques and
// artists merged with the showcase ones. Categories carry their work counts and
// empty ones are left out.
export async function loadCatalogOptions(db: Db): Promise<CatalogOptions> {
  const [dbCategories, dbTechniques, counts, artists] = await Promise.all([
    listCategories(db),
    listTechniques(db),
    countPublishedByCategory(db),
    listPublicArtists(db),
  ]);
  const ids = termIds(dbCategories, dbTechniques);

  const categories: CategoryOption[] = dbCategories.map((c) => ({ id: c.id, name: c.name, count: counts.get(c.id) ?? 0 }));
  for (const name of showcaseCategories()) {
    const id = ids.category({ category: name } as ShowcaseArtwork);
    const n = showcaseArtworks.filter((w) => w.category === name).length;
    const existing = categories.find((c) => c.id === id);
    if (existing) existing.count += n;
    else categories.push({ id, name, count: n });
  }

  const techniques: Option[] = dbTechniques.map((t) => ({ id: t.id, name: t.name }));
  for (const name of showcaseTechniques()) {
    const id = ids.technique({ technique: name } as ShowcaseArtwork);
    if (!techniques.some((t) => t.id === id)) techniques.push({ id, name });
  }

  return {
    categories: categories.filter((c) => c.count > 0),
    techniques,
    artists: [
      ...artists.filter((a) => a.works > 0).map((a) => ({ id: a.id, name: a.displayName })),
      ...showcaseArtists.map((a) => ({ id: a.id, name: a.name })),
    ],
  };
}

function toNumber(value: string | undefined) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

// Two lists already in `sort` order, merged; ties keep real works first.
function mergeSorted(real: CardArtwork[], mock: CardArtwork[], sort: CatalogSort) {
  if (sort === 'new') return [...real, ...mock];
  const before = (a: CardArtwork, b: CardArtwork) =>
    sort === 'asc' ? a.price < b.price : sort === 'desc' ? a.price > b.price : a.title.localeCompare(b.title, 'ru') < 0;
  const out: CardArtwork[] = [];
  let i = 0,
    j = 0;
  while (i < real.length || j < mock.length) {
    if (j >= mock.length || (i < real.length && !before(mock[j], real[i]))) out.push(real[i++]);
    else out.push(mock[j++]);
  }
  return out;
}

function sortMocks(list: ShowcaseArtwork[], sort: CatalogSort) {
  const out = [...list];
  if (sort === 'asc') out.sort((a, b) => a.price - b.price);
  else if (sort === 'desc') out.sort((a, b) => b.price - a.price);
  else if (sort === 'az') out.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  return out;
}

// One page of the catalog: real published works (newest first by default)
// followed by the showcase, filtered and sorted together. The database is asked
// for the first page * pageSize matches, which is all a merged page can need.
export async function searchCatalog(
  db: Db,
  params: CatalogParams,
  { page, pageSize }: { page: number; pageSize: number },
  options?: Pick<CatalogOptions, 'categories' | 'techniques'>,
) {
  const sort = parseSort(params.sort);
  const q = params.q?.trim() ?? '';
  const minPrice = toNumber(params.minPrice);
  const maxPrice = toNumber(params.maxPrice);
  const { categoryId, techniqueId, artistId } = params;

  // A filter set to a showcase-only id can't match anything in the database.
  const dbCanMatch = [categoryId, techniqueId, artistId].every((id) => !id || isUuid(id));
  const real = dbCanMatch
    ? await listPublishedArtworks(
        db,
        { categoryId, techniqueId, sellerId: artistId, minPrice, maxPrice, q },
        { page: 1, pageSize: page * pageSize },
        sort,
      )
    : { items: [], total: 0 };

  const ids = termIds(options?.categories ?? [], options?.techniques ?? []);
  const needle = q.toLowerCase();
  const mocks = sortMocks(
    showcaseArtworks.filter((w) => {
      // (links built from a showcase work alone carry its sc- id)
      if (categoryId && ![ids.category(w), showcaseTermId(w.category)].includes(categoryId)) return false;
      if (techniqueId && ![ids.technique(w), showcaseTermId(w.technique)].includes(techniqueId)) return false;
      if (artistId && w.artistId !== artistId) return false;
      if (minPrice !== undefined && w.price < minPrice) return false;
      if (maxPrice !== undefined && w.price > maxPrice) return false;
      if (needle && !`${w.title} ${showcaseArtist(w.artistId)?.name ?? ''}`.toLowerCase().includes(needle)) return false;
      return true;
    }),
    sort,
  ).map(showcaseCard);

  const merged = mergeSorted(real.items, mocks, sort);
  return {
    items: merged.slice((page - 1) * pageSize, page * pageSize),
    total: real.total + mocks.length,
  };
}

// "Ещё от художника": other works on sale by the same artist.
export async function moreByArtist(db: Db, artistId: string, exceptId: string, limit = 4): Promise<CardArtwork[]> {
  if (!isUuid(artistId)) {
    return showcaseWorksOf(artistId)
      .filter((w) => w.id !== exceptId)
      .slice(0, limit)
      .map(showcaseCard);
  }
  const { items } = await listPublishedArtworks(db, { sellerId: artistId }, { page: 1, pageSize: limit + 1 });
  return items.filter((w) => w.id !== exceptId).slice(0, limit);
}
