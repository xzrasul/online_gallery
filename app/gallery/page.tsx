import { getDb } from '@/src/db';
import { ArtworkGrid } from '@/src/components/artwork/artwork-grid';
import { Pagination } from '@/src/components/artwork/pagination';
import { CatalogFilters } from '@/src/components/sanat/catalog-filters';
import { KoshinBand } from '@/src/components/sanat/koshin-band';
import { Medal } from '@/src/components/sanat/mandala';
import { listPublishedArtworks } from '@/src/lib/artworks/public-queries';
import { catalogHref } from '@/src/lib/catalog-href';
import { listCategories } from '@/src/lib/catalog/categories';
import { listTechniques } from '@/src/lib/catalog/techniques';
import { getCurrentUser } from '@/src/lib/auth/session';
import { likeInfoFor } from '@/src/lib/likes/likes';

const PAGE_SIZE = 24;

export const metadata = {
  title: 'Каталог картин',
};

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
  const parsedPage = Number(params.page);
  const page = Number.isFinite(parsedPage) ? Math.max(1, Math.floor(parsedPage)) : 1;
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;

  const [{ items, total }, categories, techniques, user] = await Promise.all([
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
    getCurrentUser(),
  ]);
  const likes = await likeInfoFor(getDb(), items, user?.id ?? null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeCount = [params.categoryId, params.techniqueId, params.minPrice, params.maxPrice].filter(Boolean).length;
  // A new query remounts the filters (fresh field values, folded) and replays the cards' reveal.
  const query = catalogHref(params, page);

  return (
    <main>
      <KoshinBand />
      <div className="wrap stack">
        <div className="head-row">
          <h1 className="t">Каталог картин</h1>
          <Medal size="sm" />
        </div>
        <CatalogFilters
          key={query}
          categories={categories}
          techniques={techniques}
          values={params}
          activeCount={activeCount}
        />
        <section className="panel" aria-labelledby="list-title">
          <div className="sec-head">
            <h2 id="list-title">Список картин</h2>
          </div>
          {items.length === 0 ? (
            <p className="empty">Ничего не найдено.{activeCount > 0 && ' Попробуйте изменить или сбросить фильтры.'}</p>
          ) : (
            <ArtworkGrid key={query} artworks={items} revealBase={150} priorityCount={3} likes={likes} />
          )}
          <Pagination params={params} page={Math.min(page, totalPages)} totalPages={totalPages} />
        </section>
      </div>
    </main>
  );
}
