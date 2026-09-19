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
  const disabled = 'pointer-events-none opacity-50';
  return (
    <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Страницы каталога">
      <Link
        href={catalogHref(params, page - 1)}
        aria-disabled={page <= 1}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), page <= 1 && disabled)}
      >
        Назад
      </Link>
      <span className="text-sm text-muted-foreground">
        Страница {page} из {totalPages}
      </span>
      <Link
        href={catalogHref(params, page + 1)}
        aria-disabled={page >= totalPages}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), page >= totalPages && disabled)}
      >
        Вперёд
      </Link>
    </nav>
  );
}
