import { getDb } from '@/src/db';
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

  return (
    <main>
      <h1>Галерея картин</h1>
      <form method="get">
        <label>
          Категория
          <select name="categoryId" defaultValue={params.categoryId ?? ''}>
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Техника
          <select name="techniqueId" defaultValue={params.techniqueId ?? ''}>
            <option value="">Все техники</option>
            {techniques.map((technique) => (
              <option key={technique.id} value={technique.id}>
                {technique.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Цена от
          <input type="number" name="minPrice" defaultValue={params.minPrice ?? ''} />
        </label>
        <label>
          Цена до
          <input type="number" name="maxPrice" defaultValue={params.maxPrice ?? ''} />
        </label>
        <button type="submit">Применить фильтры</button>
      </form>

      {items.length === 0 && <p>Ничего не найдено.</p>}
      {items.map((artwork) => (
        <a key={artwork.id} href={`/gallery/artwork/${artwork.id}`}>
          <img src={artwork.imageUrl} alt={artwork.title} width={200} />
          <h2>{artwork.title}</h2>
          <p>{artwork.price} TJS</p>
          <p>{artwork.sellerDisplayName}</p>
        </a>
      ))}

      <p>
        Страница {page} из {totalPages}
      </p>
    </main>
  );
}
