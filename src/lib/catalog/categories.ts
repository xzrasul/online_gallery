import { eq } from 'drizzle-orm';
import type { Db } from '../../db';
import { categories } from '../../db/schema';

export async function createCategory(db: Db, name: string): Promise<string> {
  const [row] = await db.insert(categories).values({ name }).returning({ id: categories.id });
  return row.id;
}

export async function renameCategory(db: Db, input: { id: string; name: string }): Promise<void> {
  await db.update(categories).set({ name: input.name }).where(eq(categories.id, input.id));
}

export async function listCategories(db: Db): Promise<{ id: string; name: string }[]> {
  return db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.name);
}
