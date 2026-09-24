import Link from 'next/link';
import { catalogHref, type CatalogParams } from '@/src/lib/catalog-href';

export function Pagination({
  params,
  page,
  totalPages,
}: {
  params: CatalogParams;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pager" aria-label="Страницы каталога">
      {page <= 1 ? (
        <span aria-disabled="true" className="btn sm">
          Назад
        </span>
      ) : (
        <Link href={catalogHref(params, page - 1)} className="btn sm">
          Назад
        </Link>
      )}
      <span>
        Страница {page} из {totalPages}
      </span>
      {page >= totalPages ? (
        <span aria-disabled="true" className="btn sm">
          Вперёд
        </span>
      ) : (
        <Link href={catalogHref(params, page + 1)} className="btn sm">
          Вперёд
        </Link>
      )}
    </nav>
  );
}
