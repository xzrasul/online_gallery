import Link from 'next/link';
import { getDb } from '@/src/db';
import { ArtworkGrid } from '@/src/components/artwork/artwork-grid';
import { Pagination } from '@/src/components/artwork/pagination';
import { Field } from '@/src/components/form/field';
import { NativeSelect } from '@/src/components/form/native-select';
import { Button, buttonVariants } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { listPublishedArtworks } from '@/src/lib/artworks/public-queries';
import { listCategories } from '@/src/lib/catalog/categories';
import { listTechniques } from '@/src/lib/catalog/techniques';

const PAGE_SIZE = 24;

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{
    categoryId?: string;
    techniqueId?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;

  const [{ items, total }, categories, techniques] = await Promise.all([
    listPublishedArtworks(
      getDb(),
      {
        categoryId: params.categoryId || undefined,
        techniqueId: params.techniqueId || undefined,
        minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
        maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      },
      { page, pageSize: PAGE_SIZE },
    ),
    listCategories(getDb()),
    listTechniques(getDb()),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const hasFilters = Boolean(params.categoryId || params.techniqueId || params.minPrice || params.maxPrice);

  return (
    <main>
      <h1>Каталог картин</h1>
      <form
        method="get"
        className="mt-6 grid gap-4 rounded-sm border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_9rem_9rem_auto] lg:items-end"
      >
        <Field label="Категория">
          <NativeSelect name="categoryId" defaultValue={params.categoryId ?? ''}>
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Техника">
          <NativeSelect name="techniqueId" defaultValue={params.techniqueId ?? ''}>
            <option value="">Все техники</option>
            {techniques.map((technique) => (
              <option key={technique.id} value={technique.id}>
                {technique.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Цена от">
          <Input type="number" name="minPrice" min="0" defaultValue={params.minPrice ?? ''} />
        </Field>
        <Field label="Цена до">
          <Input type="number" name="maxPrice" min="0" defaultValue={params.maxPrice ?? ''} />
        </Field>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
          <Button type="submit">Применить фильтры</Button>
          {hasFilters && (
            <Link href="/gallery" className={buttonVariants({ variant: 'outline' })}>
              Сбросить
            </Link>
          )}
        </div>
      </form>

      <h2 className="sr-only">Список картин</h2>
      {items.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">
          Ничего не найдено.{hasFilters && ' Попробуйте изменить или сбросить фильтры.'}
        </p>
      ) : (
        <div className="mt-8">
          <ArtworkGrid artworks={items} />
        </div>
      )}

      <Pagination params={params} page={page} totalPages={totalPages} />
    </main>
  );
}
