import { getCurrentUser } from '@/src/lib/auth/session';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDb } from '@/src/db';
import { listArtworksForSeller } from '@/src/lib/artworks/seller-operations';
import { ArtworkImage } from '@/src/components/artwork/artwork-image';
import { StatusBadge } from '@/src/components/artwork/status-badge';
import { buttonVariants } from '@/src/components/ui/button';
import { markAsSold } from './actions';
import { SubmitButton } from '@/src/components/form/submit-button';

export default async function SellerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  if (!user || user.role !== 'seller') redirect('/');

  const myArtworks = await listArtworksForSeller(getDb(), user.id);

  return (
    <main>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1>Личный кабинет продавца</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/seller/profile" className={buttonVariants({ variant: 'outline' })}>
            Мой профиль
          </Link>
          <Link href="/dashboard/seller/new" className={buttonVariants()}>
            Добавить картину
          </Link>
        </div>
      </div>
      <h2 className="mt-8">Мои картины</h2>
      {myArtworks.length === 0 && <p className="mt-4 text-muted-foreground">У вас пока нет картин.</p>}
      <div className="mt-4 grid gap-4">
        {myArtworks.map((artwork) => (
          <section key={artwork.id} className="flex gap-4 rounded-sm border border-border bg-card p-4">
            <ArtworkImage src={artwork.imageUrl} alt="" className="w-20 shrink-0 self-start sm:w-28" sizes="112px" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3>{artwork.title}</h3>
                <StatusBadge status={artwork.status} />
              </div>
              <p className="text-sm font-semibold text-brand">{artwork.price} TJS</p>
              {artwork.status === 'rejected' && (
                <p className="text-sm text-destructive">Причина отказа: {artwork.rejectionReason}</p>
              )}
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <Link
                  href={`/dashboard/seller/${artwork.id}/edit`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Редактировать
                </Link>
                {artwork.status === 'published' && (
                  <form action={markAsSold} className="flex">
                    <input type="hidden" name="artworkId" value={artwork.id} />
                    <SubmitButton variant="outline" size="sm">
                      Отметить как продано
                    </SubmitButton>
                  </form>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
