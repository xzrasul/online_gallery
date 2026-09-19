export type CatalogParams = {
  categoryId?: string;
  techniqueId?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
};

const FILTER_KEYS = ['categoryId', 'techniqueId', 'minPrice', 'maxPrice'] as const;

export function catalogHref(params: CatalogParams, page: number): string {
  const query = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = params[key];
    if (value) query.set(key, value);
  }
  if (page > 1) query.set('page', String(page));
  const search = query.toString();
  return search ? `/gallery?${search}` : '/gallery';
}
