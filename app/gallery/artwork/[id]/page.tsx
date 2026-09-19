import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/src/db';
import { getPublishedArtworkById } from '@/src/lib/artworks/public-queries';
import { telegramHref } from '@/src/lib/telegram';
import { ArtworkImage } from '@/src/components/artwork/artwork-image';
import { Badge } from '@/src/components/ui/badge';
import { buttonVariants } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

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
      <Link href="/gallery" className="text-sm text-muted-foreground hover:text-brand">
        ← В каталог
      </Link>
      <div className="mt-6 grid gap-8 md:grid-cols-2 lg:gap-14">
        <ArtworkImage
          src={artwork.imageUrl}
          alt={artwork.title}
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="self-start md:sticky md:top-24"
        />
        <div>
          <h1>{artwork.title}</h1>
          <p className="mt-2 text-muted-foreground">
            <Link
              href={`/gallery/artist/${artwork.sellerId}`}
              className="underline-offset-4 hover:text-brand hover:underline"
            >
              {artwork.sellerDisplayName}
            </Link>
          </p>
          <p className="mt-6 text-2xl font-semibold text-brand">{artwork.price} TJS</p>
          {artwork.status === 'sold' && (
            <Badge variant="secondary" className="mt-2">
              Продано
            </Badge>
          )}
          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Размеры</dt>
            <dd>
              {artwork.heightCm}×{artwork.widthCm} см
            </dd>
            <dt className="text-muted-foreground">Категория</dt>
            <dd>{artwork.categoryName}</dd>
            <dt className="text-muted-foreground">Техника</dt>
            <dd>{artwork.techniqueName}</dd>
          </dl>
          <p className="mt-6 whitespace-pre-line leading-relaxed">{artwork.description}</p>
          {telegram ? (
            <a
              href={telegram}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: 'lg' }), 'mt-8')}
            >
              Написать художнику в Telegram
            </a>
          ) : (
            artwork.sellerTelegramContact && (
              <p className="mt-8 text-sm text-muted-foreground">Telegram: {artwork.sellerTelegramContact}</p>
            )
          )}
        </div>
      </div>
    </main>
  );
}
