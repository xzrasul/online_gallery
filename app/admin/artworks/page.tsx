import { requireStaff } from '@/src/lib/auth/staff';
import { getDb } from '@/src/db';
import { listPendingArtworks } from '@/src/lib/artworks/admin-operations';
import { AdminNav } from '@/src/components/admin/admin-nav';
import { ArtworkImage } from '@/src/components/artwork/artwork-image';
import { Input } from '@/src/components/ui/input';
import { approveArtwork, rejectArtwork } from './actions';
import { SubmitButton } from '@/src/components/form/submit-button';

export default async function AdminArtworksPage() {
  const role = await requireStaff();

  const pending = await listPendingArtworks(getDb());

  return (
    <main>
      <AdminNav role={role} />
      <h1>Картины на модерации</h1>
      {pending.length === 0 && <p className="mt-4 text-muted-foreground">Нет картин на модерации.</p>}
      <div className="mt-6 grid gap-4">
        {pending.map((artwork) => (
          <section key={artwork.id} className="flex flex-col gap-4 rounded-sm border border-border bg-card p-5 sm:flex-row">
            <ArtworkImage src={artwork.imageUrl} alt="" className="w-full sm:w-40 sm:shrink-0" sizes="160px" />
            <div className="min-w-0 flex-1">
              <h2>{artwork.title}</h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{artwork.description}</p>
              <p className="mt-3 text-sm font-semibold text-brand">
                {artwork.price} TJS · {artwork.heightCm}×{artwork.widthCm} см
              </p>
              <p className="text-sm text-muted-foreground">
                {artwork.categoryName} · {artwork.techniqueName}
              </p>
              <p className="text-sm text-muted-foreground">Художник: {artwork.sellerDisplayName}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <form action={approveArtwork}>
                  <input type="hidden" name="artworkId" value={artwork.id} />
                  <SubmitButton>Одобрить</SubmitButton>
                </form>
                <form action={rejectArtwork} className="flex w-full gap-2 sm:w-auto sm:flex-1">
                  <input type="hidden" name="artworkId" value={artwork.id} />
                  <Input type="text" name="reason" placeholder="Причина отказа" aria-label="Причина отказа" />
                  <SubmitButton variant="outline">
                    Отклонить
                  </SubmitButton>
                </form>
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
