import Link from 'next/link';
import { getDb } from '@/src/db';
import { getCurrentUser } from '@/src/lib/auth/session';
import { listPublishedArtworks } from '@/src/lib/artworks/public-queries';
import { ArtworkGrid } from '@/src/components/artwork/artwork-grid';
import { buttonVariants } from '@/src/components/ui/button';

export default async function HomePage() {
  let items: Awaited<ReturnType<typeof listPublishedArtworks>>['items'] = [];
  let loadFailed = false;
  const signedIn = Boolean(await getCurrentUser());
  try {
    ({ items } = await listPublishedArtworks(getDb(), {}, { page: 1, pageSize: 8 }));
  } catch (error) {
    console.error('home: failed to load latest artworks', error);
    loadFailed = true;
  }

  return (
    <main>
      <section className="max-w-2xl py-6 sm:py-14">
        <h1 className="text-4xl sm:text-5xl">Галерея художников</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Маркетплейс уникальных картин: оригиналы прямо от художников.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/gallery" className={buttonVariants({ size: 'lg' })}>
            В каталог
          </Link>
          <Link
            href={signedIn ? '/choose-role' : '/sign-in'}
            className={buttonVariants({ size: 'lg', variant: 'outline' })}
          >
            Хочу продавать картины
          </Link>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2>Свежие картины</h2>
          <Link href="/gallery" className="text-sm text-muted-foreground hover:text-brand">
            Смотреть все →
          </Link>
        </div>
        {loadFailed ? (
          <p className="text-muted-foreground">Не удалось загрузить свежие картины. Попробуйте позже.</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground">Пока нет опубликованных картин.</p>
        ) : (
          <ArtworkGrid artworks={items} />
        )}
      </section>
    </main>
  );
}
