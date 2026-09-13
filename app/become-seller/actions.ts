'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { createSellerApplication } from '@/src/lib/sellers/applications';

export async function submitSellerApplication(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const [user] = await getDb().select().from(users).where(eq(users.clerkUserId, userId!));
  if (!user) redirect('/sign-in');

  await createSellerApplication(getDb(), {
    userId: user.id,
    displayName: String(formData.get('displayName')),
    bio: String(formData.get('bio')),
    telegramContact: formData.get('telegramContact')
      ? String(formData.get('telegramContact'))
      : undefined,
  });

  redirect('/become-seller/status');
}
