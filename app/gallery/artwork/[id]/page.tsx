import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/src/db';
import { getPublishedArtworkById } from '@/src/lib/artworks/public-queries';
import { telegramHref } from '@/src/lib/telegram';
import { CountUp } from '@/src/components/sanat/count-up';
import { KoshinBand } from '@/src/components/sanat/koshin-band';

export default async function ArtworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artwork = await getPublishedArtworkById(getDb(), id);
  if (!artwork) notFound();
  const telegram = telegramHref(artwork.sellerTelegramContact);

  return (
    <main>
      <KoshinBand />
      <div className="wrap stack">
        <Link className="btn alt sm back" href="/gallery">
          ← В каталог
        </Link>
        <div className="work">
          <div className="frame">
            <div className="art" data-center="">
              <Image
                src={artwork.imageUrl}
                alt={artwork.title}
                fill
                priority
                sizes="(min-width: 860px) 520px, 100vw"
                unoptimized
                className="pic"
              />
            </div>
          </div>
          <div className="panel">
            <h1 className="t">{artwork.title}</h1>
            <p className="by">
              Художник: <Link href={`/gallery/artist/${artwork.sellerId}`}>{artwork.sellerDisplayName}</Link>
            </p>
            <CountUp className="big" value={artwork.price} suffix=" TJS" delay={350} />
            {artwork.status === 'sold' && <span className="tag sold">Продано</span>}
            <dl className="spec">
              <dt>Размеры</dt>
              <dd>
                {artwork.heightCm}×{artwork.widthCm} см
              </dd>
              <dt>Категория</dt>
              <dd>{artwork.categoryName}</dd>
              <dt>Техника</dt>
              <dd>{artwork.techniqueName}</dd>
            </dl>
            {artwork.description && (
              <>
                <h3>Описание</h3>
                <p className="desc">{artwork.description}</p>
              </>
            )}
            {telegram ? (
              <a className="btn" href={telegram} target="_blank" rel="noopener noreferrer">
                Написать художнику в Telegram
              </a>
            ) : (
              artwork.sellerTelegramContact && <p className="muted">Telegram: {artwork.sellerTelegramContact}</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
