import Link from 'next/link';
import { getDb } from '@/src/db';
import { listPublishedArtworks } from '@/src/lib/artworks/public-queries';
import type { StaffRole } from '@/src/lib/auth/staff';
import { BANNER_ERRORS } from '@/src/lib/home/banner-form';
import type { Banner } from '@/src/lib/home/banners';
import { AdminNav } from '@/src/components/admin/admin-nav';
import { BannerForm } from '@/src/components/admin/banner-form';
import { saveBanner } from './actions';

// Works a banner can point to: the newest on sale.
const ARTWORK_CHOICES = 300;

// The add and edit pages share everything but the banner.
export async function BannerPage({ role, banner, error }: { role: StaffRole; banner?: Banner; error?: string }) {
  const { items } = await listPublishedArtworks(getDb(), {}, { page: 1, pageSize: ARTWORK_CHOICES });
  const message = error && error in BANNER_ERRORS ? BANNER_ERRORS[error as keyof typeof BANNER_ERRORS] : null;
  return (
    <main>
      <AdminNav role={role} />
      <Link href="/admin/banners" className="text-sm text-muted-foreground hover:text-brand">
        ← Все баннеры
      </Link>
      <h1 className="mt-3">{banner ? 'Изменить баннер' : 'Новый баннер'}</h1>
      {message && (
        <p role="alert" className="notice err mt-4">
          {message}
        </p>
      )}
      <BannerForm
        action={saveBanner}
        banner={banner}
        artworks={items.map((w) => ({ id: w.id, title: w.title, artist: w.sellerDisplayName }))}
      />
    </main>
  );
}
