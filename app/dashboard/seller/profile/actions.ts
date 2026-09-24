'use server';

import { getCurrentUser } from '@/src/lib/auth/session';
import { redirect } from 'next/navigation';
import { getDb } from '@/src/db';
import { updateSellerProfile } from '@/src/lib/sellers/applications';
import { parseSellerProfileForm } from '@/src/lib/sellers/profile-form';

export async function submitSellerProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  if (!user || user.role !== 'seller') redirect('/');

  const profile = parseSellerProfileForm(formData);
  if (!profile) redirect('/dashboard/seller/profile?error=invalid');

  const updated = await updateSellerProfile(getDb(), { userId: user.id, ...profile });
  if (!updated) redirect('/become-seller/status');

  redirect('/dashboard/seller/profile?saved=1');
}
