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

  const displayName = String(formData.get('displayName') ?? '').trim();
  const bio = String(formData.get('bio') ?? '').trim();
  const telegramContactRaw = formData.get('telegramContact');
  const telegramContact =
    typeof telegramContactRaw === 'string' && telegramContactRaw.trim()
      ? telegramContactRaw.trim()
      : undefined;

  const MAX_DISPLAY_NAME_LENGTH = 200;
  const MAX_BIO_LENGTH = 2000;

  if (
    !displayName ||
    !bio ||
    displayName.length > MAX_DISPLAY_NAME_LENGTH ||
    bio.length > MAX_BIO_LENGTH
  ) {
    redirect('/become-seller?error=invalid');
  }

  await createSellerApplication(getDb(), {
    userId: user.id,
    displayName,
    bio,
    telegramContact,
  });

  redirect('/become-seller/status');
}
