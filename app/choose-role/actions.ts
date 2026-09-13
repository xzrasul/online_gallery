'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';

export async function chooseBuyer() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  redirect('/dashboard/buyer');
}

export async function chooseSeller() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [user] = await getDb().select().from(users).where(eq(users.clerkUserId, userId!));
  if (!user) redirect('/sign-in');
  redirect('/become-seller');
}
