import { eq } from 'drizzle-orm';
import type { Db } from '../../db';
import { techniques } from '../../db/schema';

export async function createTechnique(db: Db, name: string): Promise<string> {
  const [row] = await db.insert(techniques).values({ name }).returning({ id: techniques.id });
  return row.id;
}

export async function renameTechnique(db: Db, input: { id: string; name: string }): Promise<void> {
  await db.update(techniques).set({ name: input.name }).where(eq(techniques.id, input.id));
}

export async function listTechniques(db: Db): Promise<{ id: string; name: string }[]> {
  return db.select({ id: techniques.id, name: techniques.name }).from(techniques).orderBy(techniques.name);
}
