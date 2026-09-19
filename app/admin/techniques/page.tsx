import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { listTechniques } from '@/src/lib/catalog/techniques';
import { addTechnique, renameTechniqueAction } from './actions';

export default async function AdminTechniquesPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [admin] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!admin || admin.role !== 'admin') redirect('/');

  const techniques = await listTechniques(getDb());

  return (
    <main>
      <h1>Техники</h1>
      <ul>
        {techniques.map((technique) => (
          <li key={technique.id}>
            <form action={renameTechniqueAction}>
              <input type="hidden" name="id" value={technique.id} />
              <input type="text" name="name" defaultValue={technique.name} />
              <button type="submit">Переименовать</button>
            </form>
          </li>
        ))}
      </ul>
      <form action={addTechnique}>
        <input type="text" name="name" placeholder="Новая техника" required />
        <button type="submit">Добавить</button>
      </form>
    </main>
  );
}
