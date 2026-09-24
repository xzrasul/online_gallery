'use server';

import { getCurrentUser } from '@/src/lib/auth/session';
import { redirect } from 'next/navigation';
import { safeNextPath } from '@/src/lib/auth/next-path';

// A buyer goes straight back to where they signed in from (e.g. the artwork
// they wanted to like), otherwise to the buyer cabinet.
export async function chooseBuyer(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  redirect(safeNextPath(formData.get('next')) ?? '/dashboard/buyer');
}

export async function chooseSeller() {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  redirect('/become-seller');
}
