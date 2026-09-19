import { notFound } from 'next/navigation';
import { getDb } from '@/src/db';
import { getArtistPublicProfile } from '@/src/lib/artworks/public-queries';

export default async function ArtistPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getArtistPublicProfile(getDb(), id);
  if (!profile) notFound();

  return (
    <main>
      <h1>{profile.displayName}</h1>
      <p>{profile.bio}</p>
      {profile.telegramContact && <p>Telegram: {profile.telegramContact}</p>}
      <h2>Картины</h2>
      {profile.artworks.length === 0 && <p>Пока нет опубликованных картин.</p>}
      {profile.artworks.map((artwork) => (
        <a key={artwork.id} href={`/gallery/artwork/${artwork.id}`}>
          <img src={artwork.imageUrl} alt={artwork.title} width={200} />
          <h3>{artwork.title}</h3>
          <p>
            {artwork.price} TJS {artwork.status === 'sold' && '(Продано)'}
          </p>
        </a>
      ))}
    </main>
  );
}
