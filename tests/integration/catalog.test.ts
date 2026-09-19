import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { categories, techniques } from '../../src/db/schema';
import { createCategory, renameCategory, listCategories } from '../../src/lib/catalog/categories';
import { createTechnique, renameTechnique, listTechniques } from '../../src/lib/catalog/techniques';

describe('categories', () => {
  const name = 'Тест-живопись';
  const renamedName = 'Тест-живопись (переименовано)';

  afterEach(async () => {
    await getDb().delete(categories).where(eq(categories.name, name));
    await getDb().delete(categories).where(eq(categories.name, renamedName));
  });

  it('creates, renames, and lists a category', async () => {
    const id = await createCategory(getDb(), name);
    let all = await listCategories(getDb());
    expect(all.some((c) => c.id === id && c.name === name)).toBe(true);

    await renameCategory(getDb(), { id, name: renamedName });
    all = await listCategories(getDb());
    expect(all.some((c) => c.id === id && c.name === renamedName)).toBe(true);
  });
});

describe('techniques', () => {
  const name = 'Тест-масло';
  const renamedName = 'Тест-масло (переименовано)';

  afterEach(async () => {
    await getDb().delete(techniques).where(eq(techniques.name, name));
    await getDb().delete(techniques).where(eq(techniques.name, renamedName));
  });

  it('creates, renames, and lists a technique', async () => {
    const id = await createTechnique(getDb(), name);
    let all = await listTechniques(getDb());
    expect(all.some((t) => t.id === id && t.name === name)).toBe(true);

    await renameTechnique(getDb(), { id, name: renamedName });
    all = await listTechniques(getDb());
    expect(all.some((t) => t.id === id && t.name === renamedName)).toBe(true);
  });
});
