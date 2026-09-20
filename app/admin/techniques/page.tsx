import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { listTechniques } from '@/src/lib/catalog/techniques';
import { AdminNav } from '@/src/components/admin/admin-nav';
import { ReferenceList } from '@/src/components/admin/reference-list';
import { addTechnique, renameTechniqueAction } from './actions';

export default async function AdminTechniquesPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [admin] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!admin || admin.role !== 'admin') redirect('/');

  const techniques = await listTechniques(getDb());

  return (
    <main>
      <AdminNav />
      <ReferenceList
        title="Техники"
        items={techniques}
        renameAction={renameTechniqueAction}
        addAction={addTechnique}
        addPlaceholder="Новая техника"
      />
    </main>
  );
}
