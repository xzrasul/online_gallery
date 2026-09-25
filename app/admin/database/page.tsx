import Link from 'next/link';
import { getDb } from '@/src/db';
import { requireStaff } from '@/src/lib/auth/staff';
import { DB_TABLES, tableCounts, type TableName } from '@/src/lib/admin/db-editor';
import { AdminNav } from '@/src/components/admin/admin-nav';

export const metadata = { title: 'База данных', robots: { index: false, follow: false } };

// Admin only: every table in the database, with its row count.
export default async function DatabasePage() {
  const role = await requireStaff('admin');
  const counts = await tableCounts(getDb());

  return (
    <main>
      <AdminNav role={role} />
      <h1>База данных</h1>
      <p className="mt-2 text-muted-foreground">Полный доступ: просмотр, добавление, изменение и удаление записей.</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(DB_TABLES) as TableName[]).map((name) => (
          <li key={name}>
            <Link
              href={`/admin/database/${name}`}
              className="flex min-h-11 items-center justify-between gap-3 rounded-sm border border-border bg-card p-5 hover:border-brand"
            >
              <span>
                <span className="block">{DB_TABLES[name].label}</span>
                <code className="text-xs text-muted-foreground">{name}</code>
              </span>
              <span className="text-brand">{counts[name]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
