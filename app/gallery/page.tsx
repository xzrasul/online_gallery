import Link from 'next/link';
import { getDb } from '@/src/db';
import { ArtworkGrid } from '@/src/components/artwork/artwork-grid';
import { Pagination } from '@/src/components/artwork/pagination';
import { CatalogFilters, type ActiveTag } from '@/src/components/sanat/catalog-filters';
import { catalogHref, type CatalogParams } from '@/src/lib/catalog-href';
import { loadCatalogOptions, searchCatalog } from '@/src/lib/gallery/catalog';
import { heartsFor } from '@/src/lib/gallery/likes';
import { getCurrentUser } from '@/src/lib/auth/session';
import { plural } from '@/src/lib/ru-format';

const PAGE_SIZE = 24;

export const metadata = {
  title: 'Каталог картин',
  description: 'Оригинальные картины напрямую от художников: выбирайте по категории, технике и цене.',
};

export default async function GalleryPage({ searchParams }: { searchParams: Promise<CatalogParams> }) {
  const params = await searchParams;
  const parsedPage = Number(params.page);
  const page = Number.isFinite(parsedPage) ? Math.max(1, Math.floor(parsedPage)) : 1;

  const [options, user] = await Promise.all([loadCatalogOptions(getDb()), getCurrentUser()]);
  const { items, total } = await searchCatalog(getDb(), params, { page, pageSize: PAGE_SIZE }, options);
  const likes = await heartsFor(getDb(), items, user?.id ?? null);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const nameOf = (list: { id: string; name: string }[], id?: string) => list.find((o) => o.id === id)?.name ?? '…';
  const tags: ActiveTag[] = [];
  if (params.categoryId) tags.push({ label: `Категория: ${nameOf(options.categories, params.categoryId)}`, href: catalogHref(params, 1, ['categoryId']) });
  if (params.artistId) tags.push({ label: `Художник: ${nameOf(options.artists, params.artistId)}`, href: catalogHref(params, 1, ['artistId']) });
  if (params.techniqueId) tags.push({ label: `Техника: ${nameOf(options.techniques, params.techniqueId)}`, href: catalogHref(params, 1, ['techniqueId']) });
  if (params.minPrice || params.maxPrice) {
    const range = [params.minPrice && `от ${params.minPrice}`, params.maxPrice && `до ${params.maxPrice}`].filter(Boolean).join(' ');
    tags.push({ label: `Цена: ${range} TJS`, href: catalogHref(params, 1, ['minPrice', 'maxPrice']) });
  }
  // A new query replays the cards' reveal.
  const query = catalogHref(params, page);

  return (
    <main>
      <div className="wrap stack pg">
        <div className="head-row">
          <h1 className="t">Каталог картин</h1>
          <p className="count" aria-live="polite">
            {total} {plural(total, ['картина', 'картины', 'картин'])}
          </p>
        </div>
        <CatalogFilters options={options} values={params} activeCount={tags.length} tags={tags} query={query} />
        {items.length === 0 ? (
          <div className="empty">
            <h3>Ничего не найдено</h3>
            <p>Попробуйте изменить запрос или убрать часть фильтров.</p>
            <Link className="btn" href="/gallery">
              Сбросить фильтры
            </Link>
          </div>
        ) : (
          <ArtworkGrid key={query} artworks={items} revealBase={150} priorityCount={4} likes={likes} />
        )}
        <Pagination params={params} page={Math.min(page, totalPages)} totalPages={totalPages} />
      </div>
    </main>
  );
}
