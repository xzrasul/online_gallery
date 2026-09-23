'use server';

import { getCurrentUser } from '@/src/lib/auth/session';
import { redirect } from 'next/navigation';

export async function chooseBuyer() {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  redirect('/dashboard/buyer');
}

export async function chooseSeller() {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  redirect('/become-seller');
}
