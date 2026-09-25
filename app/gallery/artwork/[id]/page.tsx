import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { cache, type ReactNode } from 'react';
import { pagePreview, snippet } from '@/src/lib/seo';
import { getDb } from '@/src/db';
import { getPublishedArtworkById } from '@/src/lib/artworks/public-queries';
import { telegramHref } from '@/src/lib/telegram';
import { getCurrentUser } from '@/src/lib/auth/session';
import { moreByArtist } from '@/src/lib/gallery/catalog';
import { heartsFor } from '@/src/lib/gallery/likes';
import { isUuid } from '@/src/lib/gallery/types';
import { showcaseArtist, showcaseArtwork, showcaseImage, showcaseTermId } from '@/src/lib/showcase';
import { ArtworkFrame } from '@/src/components/artwork/artwork-frame';
import { ArtworkGrid } from '@/src/components/artwork/artwork-grid';
import { BuyBar } from '@/src/components/artwork/buy-bar';
import { LikeButton } from '@/src/components/likes/like-button';

type Shown = {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  ratio: number;
  sold: boolean;
  mock: boolean;
  categoryId?: string;
  categoryName: string;
  techniqueName: string;
  size?: string;
  year?: number;
  artistId: string;
  artistName: string;
  telegram?: string | null;
};

// One lookup per request, shared by the page and its link preview. Showcase
// works have word ids; anything else must be a uuid to reach the database.
const loadArtwork = cache(async (id: string): Promise<Shown | undefined> => {
  const mock = showcaseArtwork(id);
  if (mock) {
    return {
      id: mock.id,
      title: mock.title,
      description: mock.description,
      price: mock.price,
      imageUrl: showcaseImage(mock, true),
      ratio: mock.width / mock.height,
      sold: false,
      mock: true,
      categoryId: showcaseTermId(mock.category),
      categoryName: mock.category,
      techniqueName: mock.technique,
      size: mock.size,
      year: mock.year,
      artistId: mock.artistId,
      artistName: showcaseArtist(mock.artistId)?.name ?? '',
    };
  }
  if (!isUuid(id)) return undefined;
  const a = await getPublishedArtworkById(getDb(), id);
  if (!a) return undefined;
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    price: a.price,
    imageUrl: a.imageUrl,
    ratio: a.widthCm > 0 && a.heightCm > 0 ? a.widthCm / a.heightCm : 4 / 5,
    sold: a.status === 'sold',
    mock: false,
    categoryId: a.categoryId,
    categoryName: a.categoryName,
    techniqueName: a.techniqueName,
    size: `${a.heightCm}×${a.widthCm} см`,
    artistId: a.sellerId,
    artistName: a.sellerDisplayName,
    telegram: a.sellerTelegramContact,
  };
});

// Link preview: "Title — Artist", price · size · technique, and the photo itself.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const artwork = await loadArtwork((await params).id);
  if (!artwork) return {};
  const title = `${artwork.title} — ${artwork.artistName}`;
  const facts = [artwork.sold ? 'Продано' : `${artwork.price} TJS`, artwork.size, artwork.techniqueName]
    .filter(Boolean)
    .join(' · ');
  const description = snippet(`${facts}. ${artwork.description}`);
  return {
    title,
    description,
    ...pagePreview({ title, description, image: { url: artwork.imageUrl, alt: artwork.title } }),
  };
}

export default async function ArtworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [artwork, viewer] = await Promise.all([loadArtwork(id), getCurrentUser()]);
  if (!artwork) notFound();

  const more = await moreByArtist(getDb(), artwork.artistId, artwork.id);
  const self = { id: artwork.id, title: artwork.title, price: artwork.price, imageUrl: '', sellerId: artwork.artistId, mock: artwork.mock };
  const likes = await heartsFor(getDb(), [self, ...more], viewer?.id ?? null);
  const telegram = telegramHref(artwork.telegram ?? null);
  const categoryHref = artwork.categoryId ? `/gallery?categoryId=${encodeURIComponent(artwork.categoryId)}` : '/gallery';

  let contact: ReactNode;
  if (artwork.sold) contact = <span className="buybar-note">Работа продана</span>;
  else if (telegram)
    contact = (
      <a className="btn" href={telegram} target="_blank" rel="noopener noreferrer">
        Написать в Telegram
      </a>
    );
  else if (artwork.telegram) contact = <span className="buybar-note">Telegram: {artwork.telegram}</span>;
  else if (artwork.mock)
    contact = (
      <span className="btn" aria-disabled="true" title="Это макет: связаться с художником нельзя">
        Написать в Telegram
      </span>
    );

  return (
    <main className="has-buybar">
      <div className="wrap stack pg">
        <nav className="crumbs" aria-label="Путь">
          <Link href="/">Главная</Link>
          <span aria-hidden="true">/</span>
          <Link href="/gallery">Каталог</Link>
          <span aria-hidden="true">/</span>
          <Link href={categoryHref}>{artwork.categoryName}</Link>
        </nav>
        <div className="work">
          <ArtworkFrame src={artwork.imageUrl} alt={`${artwork.title}, ${artwork.artistName}`} ratio={artwork.ratio}>
            {artwork.mock && <span className="badge">макет</span>}
            <LikeButton artworkId={artwork.id} info={likes[artwork.id]} local={artwork.mock} size="big" />
          </ArtworkFrame>
          <div className="panel info">
            <div className="chips">
              <Link className="chip" href={categoryHref}>
                {artwork.categoryName}
              </Link>
              {artwork.mock && <span className="chip tag">Классика · макет</span>}
            </div>
            <h1 className="t">{artwork.title}</h1>
            <p className="by">
              Художник: <Link href={`/gallery/artist/${artwork.artistId}`}>{artwork.artistName}</Link>
            </p>
            {artwork.sold ? <p className="stock sold">Продано</p> : <p className="stock">В наличии</p>}
            <dl className="spec">
              {artwork.size && (
                <>
                  <dt>Размеры</dt>
                  <dd>{artwork.size}</dd>
                </>
              )}
              <dt>Категория</dt>
              <dd>{artwork.categoryName}</dd>
              <dt>Техника</dt>
              <dd>{artwork.techniqueName}</dd>
              {artwork.year && (
                <>
                  <dt>Год</dt>
                  <dd>{artwork.year}</dd>
                </>
              )}
            </dl>
            {artwork.description && (
              <>
                <h2 className="sub">Описание</h2>
                <p className="desc">{artwork.description}</p>
              </>
            )}
            <p className="small">
              {artwork.mock
                ? 'Это макет: репродукция из общественного достояния, цена и наличие условные.'
                : 'Оплату и доставку вы обсуждаете напрямую с художником.'}
            </p>
          </div>
        </div>
        {more.length > 0 && (
          <section className="sec" aria-labelledby="more-title">
            <div className="sec-head">
              <h2 id="more-title">Ещё от художника</h2>
            </div>
            <ArtworkGrid artworks={more} likes={likes} />
          </section>
        )}
      </div>
      <BuyBar price={artwork.sold ? 'Продано' : `${artwork.price} TJS`}>{contact}</BuyBar>
    </main>
  );
}
