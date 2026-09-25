import { notFound } from 'next/navigation';
import { requireStaff } from '@/src/lib/auth/staff';
import { getDb } from '@/src/db';
import { isUuid } from '@/src/lib/gallery/types';
import { getBanner } from '@/src/lib/home/banners';
import { BannerPage } from '../banner-page';

export const metadata = { title: 'Изменить баннер' };

export default async function EditBannerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const role = await requireStaff('admin');
  const { id } = await params;
  const banner = isUuid(id) ? await getBanner(getDb(), id) : undefined;
  if (!banner) notFound();
  return <BannerPage role={role} banner={banner} error={(await searchParams).error} />;
}
