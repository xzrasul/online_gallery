import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { cache } from 'react';
import { pagePreview, snippet } from '@/src/lib/seo';
import { getDb } from '@/src/db';
import { getPublishedArtworkById } from '@/src/lib/artworks/public-queries';
import { telegramHref } from '@/src/lib/telegram';
import { CountUp } from '@/src/components/sanat/count-up';
import { LikeButton } from '@/src/components/likes/like-button';
import { getCurrentUser } from '@/src/lib/auth/session';
import { likeInfoFor } from '@/src/lib/likes/likes';
import { KoshinBand } from '@/src/components/sanat/koshin-band';

// One query per request, shared by the page and its link preview.
const loadArtwork = cache((id: string) => getPublishedArtworkById(getDb(), id));

// Link preview: "Title — Artist", price · size · technique, and the photo itself.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const artwork = await loadArtwork((await params).id);
  if (!artwork) return {};
  const title = `${artwork.title} — ${artwork.sellerDisplayName}`;
  const facts = [
    artwork.status === 'sold' ? 'Продано' : `${artwork.price} TJS`,
    `${artwork.heightCm}×${artwork.widthCm} см`,
    artwork.techniqueName,
  ].join(' · ');
  const description = snippet(`${facts}. ${artwork.description}`);
  return {
    title,
    description,
    ...pagePreview({ title, description, image: { url: artwork.imageUrl, alt: artwork.title } }),
  };
}

export default async function ArtworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [artwork, viewer] = await Promise.all([loadArtwork(id), getCurrentUser()]);
  if (!artwork) notFound();
  const telegram = telegramHref(artwork.sellerTelegramContact);
  const likes = await likeInfoFor(getDb(), [{ id: artwork.id, sellerId: artwork.sellerId }], viewer?.id ?? null);

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
            <div className="price-row">
              <CountUp className="big" value={artwork.price} suffix=" TJS" delay={350} />
              <LikeButton artworkId={artwork.id} info={likes[artwork.id]} size="big" />
            </div>
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
