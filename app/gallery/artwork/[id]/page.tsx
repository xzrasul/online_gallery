import { notFound } from 'next/navigation';
import { getDb } from '@/src/db';
import { getPublishedArtworkById } from '@/src/lib/artworks/public-queries';

export default async function ArtworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artwork = await getPublishedArtworkById(getDb(), id);
  if (!artwork) notFound();

  return (
    <main>
      <img src={artwork.imageUrl} alt={artwork.title} width={400} />
      <h1>{artwork.title}</h1>
      <p>{artwork.description}</p>
      <p>
        {artwork.price} TJS {artwork.status === 'sold' && '— Продано'}
      </p>
      <p>
        {artwork.heightCm}×{artwork.widthCm} см · {artwork.categoryName} · {artwork.techniqueName}
      </p>
      <a href={`/gallery/artist/${artwork.sellerId}`}>{artwork.sellerDisplayName}</a>
    </main>
  );
}
