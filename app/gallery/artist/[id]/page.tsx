import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/src/db';
import { getArtistPublicProfile } from '@/src/lib/artworks/public-queries';
import { telegramHref } from '@/src/lib/telegram';
import { ArtworkGrid } from '@/src/components/artwork/artwork-grid';
import { buttonVariants } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

export default async function ArtistPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getArtistPublicProfile(getDb(), id);
  if (!profile) notFound();
  const telegram = telegramHref(profile.telegramContact);

  return (
    <main>
      <Link href="/gallery" className="text-sm text-muted-foreground hover:text-brand">
        ← В каталог
      </Link>
      <div className="mt-6 max-w-2xl">
        <h1>{profile.displayName}</h1>
        <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{profile.bio}</p>
        {telegram ? (
          <a
            href={telegram}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-5')}
          >
            Написать в Telegram
          </a>
        ) : (
          profile.telegramContact && (
            <p className="mt-5 text-sm text-muted-foreground">Telegram: {profile.telegramContact}</p>
          )
        )}
      </div>

      <h2 className="mt-12 mb-6">Картины</h2>
      {profile.artworks.length === 0 ? (
        <p className="text-muted-foreground">Пока нет опубликованных картин.</p>
      ) : (
        <ArtworkGrid artworks={profile.artworks} />
      )}
    </main>
  );
}
