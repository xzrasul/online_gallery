import { requireStaff } from '@/src/lib/auth/staff';
import { BannerPage } from '../banner-page';

export const metadata = { title: 'Новый баннер' };

export default async function NewBannerPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const role = await requireStaff('admin');
  return <BannerPage role={role} error={(await searchParams).error} />;
}
