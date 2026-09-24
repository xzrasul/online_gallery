'use server';

import { getCurrentUser } from '@/src/lib/auth/session';
import { redirect } from 'next/navigation';
import { getDb } from '@/src/db';
import { createSellerApplication } from '@/src/lib/sellers/applications';
import { parseSellerProfileForm } from '@/src/lib/sellers/profile-form';

export async function submitSellerApplication(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');

  const profile = parseSellerProfileForm(formData);
  if (!profile) redirect('/become-seller?error=invalid');

  await createSellerApplication(getDb(), { userId: user.id, ...profile });

  redirect('/become-seller/status');
}
