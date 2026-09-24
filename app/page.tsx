import Link from 'next/link';
import type { CSSProperties } from 'react';
import { getDb } from '@/src/db';
import { getCurrentUser } from '@/src/lib/auth/session';
import { listPublishedArtworks } from '@/src/lib/artworks/public-queries';
import { likeInfoFor } from '@/src/lib/likes/likes';
import { ArtworkGrid } from '@/src/components/artwork/artwork-grid';
import { BrandTitle } from '@/src/components/sanat/brand-title';
import { KoshinBand } from '@/src/components/sanat/koshin-band';
import { Medal } from '@/src/components/sanat/mandala';
import { BRAND_NAME, BRAND_TAGLINE } from '@/src/lib/brand';

const delay = (ms: number) => ({ '--d': ms }) as CSSProperties;

export default async function HomePage() {
  let items: Awaited<ReturnType<typeof listPublishedArtworks>>['items'] = [];
  let likes: Awaited<ReturnType<typeof likeInfoFor>> = {};
  let loadFailed = false;
  const user = await getCurrentUser();
  const signedIn = Boolean(user);
  try {
    ({ items } = await listPublishedArtworks(getDb(), {}, { page: 1, pageSize: 6 }));
    likes = await likeInfoFor(getDb(), items, user?.id ?? null);
  } catch (error) {
    console.error('home: failed to load latest artworks', error);
    loadFailed = true;
  }

  return (
    <main>
      <div className="hero">
        <div className="wrap hero-in">
          <div>
            <p className="eyebrow in" style={delay(0)}>
              Хуш омадед
            </p>
            <BrandTitle />
            <p className="lead in" style={delay(800)}>
              {BRAND_TAGLINE}
            </p>
            <div className="actions in" style={delay(950)}>
              <span className="halo">
                <Link className="btn" href="/gallery">
                  В каталог
                </Link>
              </span>
              <Link className="btn alt" href={signedIn ? '/choose-role' : '/sign-in'}>
                Хочу продавать картины
              </Link>
            </div>
            <div className="note in" style={delay(1100)}>
              <div className="word">
                <span className="cyr">санъат</span>
                <span className="fa" lang="fa" dir="rtl">
                  صنعت
                </span>
              </div>
              <p>«Санъат» по-таджикски — искусство. {BRAND_NAME} — место, где его находят.</p>
            </div>
          </div>
          <Medal size="lg" />
        </div>
      </div>
      <KoshinBand />
      <div className="wrap stack">
        <section className="panel" aria-labelledby="fresh-title">
          <div className="sec-head">
            <h2 id="fresh-title">Свежие картины</h2>
            <Link className="more" href="/gallery">
              Смотреть все →
            </Link>
          </div>
          {loadFailed ? (
            <p className="empty">Не удалось загрузить свежие картины. Попробуйте позже.</p>
          ) : items.length === 0 ? (
            <p className="empty">Пока нет опубликованных картин.</p>
          ) : (
            <ArtworkGrid artworks={items} likes={likes} />
          )}
        </section>
      </div>
    </main>
  );
}
