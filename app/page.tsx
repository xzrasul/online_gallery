import Image from 'next/image';
import Link from 'next/link';
import { getDb } from '@/src/db';
import { getCurrentUser } from '@/src/lib/auth/session';
import { searchCatalog } from '@/src/lib/gallery/catalog';
import { likeInfoFor, type LikeInfo } from '@/src/lib/likes/likes';
import { plural } from '@/src/lib/ru-format';
import { ArtworkCard } from '@/src/components/artwork/artwork-card';
import { KoshinBand } from '@/src/components/sanat/koshin-band';
import { Rail } from '@/src/components/sanat/rail';

const RAIL_SIZE = 8;

export default async function HomePage() {
  const user = await getCurrentUser();
  let items: Awaited<ReturnType<typeof searchCatalog>>['items'] = [];
  let total = 0;
  let likes: Record<string, LikeInfo> = {};
  let loadFailed = false;
  try {
    ({ items, total } = await searchCatalog(getDb(), {}, { page: 1, pageSize: RAIL_SIZE }));
    likes = await likeInfoFor(getDb(), items, user?.id ?? null);
  } catch (error) {
    console.error('home: failed to load latest artworks', error);
    loadFailed = true;
  }
  // the newest works: one tall picture and two square ones
  const tiles = items.slice(0, 3).map((w, i) => ({ ...w, slot: 'abc'[i] }));

  return (
    <main>
      <div className="wrap home-hero">
        <div className="hero-copy">
          <h1 className="hero-t">Картины прямо от художников</h1>
          <p className="eyebrow">
            <span>Санъат</span>
            <span className="fa" lang="fa" dir="rtl">
              صنعت
            </span>
          </p>
        </div>
        {tiles.length > 0 && (
          <div className={`collage n${tiles.length}`} role="group" aria-label="Работы художников">
            {tiles.map((w) => (
              <Link key={w.id} className={`tile ${w.slot}`} href={`/gallery/artwork/${w.id}`} aria-label={w.title}>
                <Image
                  src={w.imageUrl}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 860px) 280px, 50vw"
                  unoptimized
                  className="pic"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
      <KoshinBand />
      <div className="wrap stack pg">
        {loadFailed ? (
          <p className="empty">Не удалось загрузить новые поступления. Попробуйте позже.</p>
        ) : items.length === 0 ? (
          <p className="empty">Пока нет опубликованных картин.</p>
        ) : (
          <Rail title="Новые поступления">
            {items.map((w) => (
              <ArtworkCard key={w.id} artwork={w} like={likes[w.id]} />
            ))}
            <Link className="all" href="/gallery">
              <span className="all-c" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M4 12h15M13 6l6 6-6 6" />
                </svg>
              </span>
              <b>Все картины</b>
              <small>
                {total} {plural(total, ['работа', 'работы', 'работ'])}
              </small>
            </Link>
          </Rail>
        )}
      </div>
    </main>
  );
}
