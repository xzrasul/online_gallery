export type CatalogParams = {
  q?: string;
  categoryId?: string;
  techniqueId?: string;
  artistId?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
};

export const FILTER_KEYS = ['q', 'categoryId', 'techniqueId', 'artistId', 'minPrice', 'maxPrice', 'sort'] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

// `without` drops some filters (the ✕ on an active-filter tag); "new" is the default sort.
export function catalogHref(params: CatalogParams, page: number, without: FilterKey[] = []): string {
  const query = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = params[key]?.trim();
    if (!value || without.includes(key) || (key === 'sort' && value === 'new')) continue;
    query.set(key, value);
  }
  if (page > 1) query.set('page', String(page));
  const search = query.toString();
  return search ? `/gallery?${search}` : '/gallery';
}
