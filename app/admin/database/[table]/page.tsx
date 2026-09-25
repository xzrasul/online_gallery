import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/src/db';
import { requireStaff } from '@/src/lib/auth/staff';
import { DB_TABLES, PAGE_SIZE, columnsOf, display, isTableName, listRows, rowKey } from '@/src/lib/admin/db-editor';
import { AdminNav } from '@/src/components/admin/admin-nav';
import { buttonVariants } from '@/src/components/ui/button';

export const metadata = { title: 'База данных', robots: { index: false, follow: false } };

const cut = (s: string) => (s.length > 48 ? `${s.slice(0, 47)}…` : s);

// One table, 50 rows a page; a row opens its editor.
export default async function TablePage({
  params,
  searchParams,
}: {
  params: Promise<{ table: string }>;
  searchParams: Promise<{ page?: string; deleted?: string }>;
}) {
  const role = await requireStaff('admin');
  const { table } = await params;
  if (!isTableName(table)) notFound();
  const sp = await searchParams;
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);
  const { rows, total } = await listRows(getDb(), table, page);
  const columns = columnsOf(table);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main>
      <AdminNav role={role} />
      <p className="text-sm text-muted-foreground">
        <Link href="/admin/database" className="hover:text-brand">
          База данных
        </Link>{' '}
        / <code>{table}</code>
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1>{DB_TABLES[table].label}</h1>
        <Link href={`/admin/database/${table}/row?new=1`} className={buttonVariants({ size: 'lg' })}>
          Добавить запись
        </Link>
      </div>
      {sp.deleted && (
        <p role="status" className="mt-4 rounded-sm bg-accent px-4 py-2 text-sm">
          Запись удалена.
        </p>
      )}
      <p className="mt-3 text-sm text-muted-foreground">
        Записей: {total}. Время — UTC.
      </p>
      <div className="mt-4 overflow-x-auto rounded-sm border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2" />
              {columns.map((c) => (
                <th key={c.key} className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const key = rowKey(table, row);
              return (
                <tr key={key} className="border-b border-border last:border-0 hover:bg-accent">
                  <td className="px-3 py-1">
                    <Link
                      href={`/admin/database/${table}/row?key=${encodeURIComponent(key)}`}
                      className="inline-flex min-h-11 items-center text-brand hover:underline"
                    >
                      Открыть
                    </Link>
                  </td>
                  {columns.map((c) => {
                    const v = display(c, row[c.key]);
                    return (
                      <td key={c.key} className="max-w-72 px-3 py-1 align-middle whitespace-nowrap" title={v}>
                        {v === '' && row[c.key] == null ? <span className="text-muted-foreground">NULL</span> : cut(v)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-muted-foreground">Таблица пуста.</p>}
      </div>
      {pages > 1 && (
        <nav className="mt-4 flex items-center gap-3" aria-label="Страницы таблицы">
          {page > 1 && (
            <Link className={buttonVariants({ variant: 'outline' })} href={`/admin/database/${table}?page=${page - 1}`}>
              Назад
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Страница {page} из {pages}
          </span>
          {page < pages && (
            <Link className={buttonVariants({ variant: 'outline' })} href={`/admin/database/${table}?page=${page + 1}`}>
              Вперёд
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
