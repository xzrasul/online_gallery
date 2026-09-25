import { describe, it, expect } from 'vitest';
import { catalogHref } from '../../src/lib/catalog-href';

describe('catalogHref', () => {
  it('returns the bare catalog URL for page 1 without filters', () => {
    expect(catalogHref({}, 1)).toBe('/gallery');
  });
  it('keeps filters and drops empty values', () => {
    expect(catalogHref({ categoryId: 'c1', techniqueId: '', minPrice: '100' }, 1)).toBe(
      '/gallery?categoryId=c1&minPrice=100',
    );
  });
  it('keeps the search, artist and sort, but not the default sort', () => {
    expect(catalogHref({ q: ' ночь ', artistId: 'van-gogh', sort: 'asc' }, 1)).toBe(
      `/gallery?q=${encodeURIComponent('ночь')}&artistId=van-gogh&sort=asc`,
    );
    expect(catalogHref({ sort: 'new' }, 1)).toBe('/gallery');
  });
  it('drops the filters named in `without` (the ✕ on a tag)', () => {
    expect(catalogHref({ q: 'a', minPrice: '1', maxPrice: '9', categoryId: 'c1' }, 4, ['minPrice', 'maxPrice'])).toBe(
      '/gallery?q=a&categoryId=c1&page=4',
    );
  });
  it('adds the page only when it is greater than 1', () => {
    expect(catalogHref({ categoryId: 'c1' }, 3)).toBe('/gallery?categoryId=c1&page=3');
    expect(catalogHref({}, 2)).toBe('/gallery?page=2');
  });
});
