import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { categories } from '../../src/db/schema';
import { loadCatalogOptions } from '../../src/lib/gallery/catalog';

describe('catalog filter options', () => {
  let categoryId: string | undefined;

  afterEach(async () => {
    if (categoryId) await getDb().delete(categories).where(eq(categories.id, categoryId));
  });

  it('lists a category with no works yet, with a zero count', async () => {
    const [category] = await getDb()
      .insert(categories)
      .values({ name: `Пустая категория фильтра ${Date.now()}` })
      .returning();
    categoryId = category.id;

    const { categories: options } = await loadCatalogOptions(getDb());
    expect(options).toContainEqual({ id: category.id, name: category.name, count: 0 });
  });
});
