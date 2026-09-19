import Link from 'next/link';
import { buttonVariants } from '@/src/components/ui/button';
import { catalogHref, type CatalogParams } from '@/src/lib/catalog-href';
import { cn } from '@/src/lib/utils';

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
  const buttonClass = buttonVariants({ variant: 'outline', size: 'sm' });
  const disabledClass = cn(buttonClass, 'pointer-events-none opacity-50');
  return (
    <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Страницы каталога">
      {page <= 1 ? (
        <span aria-disabled="true" className={disabledClass}>
          Назад
        </span>
      ) : (
        <Link href={catalogHref(params, page - 1)} className={buttonClass}>
          Назад
        </Link>
      )}
      <span className="text-sm text-muted-foreground">
        Страница {page} из {totalPages}
      </span>
      {page >= totalPages ? (
        <span aria-disabled="true" className={disabledClass}>
          Вперёд
        </span>
      ) : (
        <Link href={catalogHref(params, page + 1)} className={buttonClass}>
          Вперёд
        </Link>
      )}
    </nav>
  );
}
