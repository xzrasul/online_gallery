import { getCurrentUser } from '@/src/lib/auth/session';
import { redirect } from 'next/navigation';
import { getDb } from '@/src/db';
import { listTechniques } from '@/src/lib/catalog/techniques';
import { AdminNav } from '@/src/components/admin/admin-nav';
import { ReferenceList } from '@/src/components/admin/reference-list';
import { addTechnique, renameTechniqueAction } from './actions';

export default async function AdminTechniquesPage() {
  const admin = await getCurrentUser();
  if (!admin) redirect('/sign-in');
  if (admin.role !== 'admin') redirect('/');

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
