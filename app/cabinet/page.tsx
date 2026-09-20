import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users, sellerApplications } from '@/src/db/schema';

// Личный кабинет: отправляет пользователя в кабинет, соответствующий его роли.
export default async function CabinetPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const [user] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!user) redirect('/choose-role');

  if (user.role === 'admin') redirect('/admin/sellers');
  if (user.role === 'seller') redirect('/dashboard/seller');

  const [application] = await getDb()
    .select()
    .from(sellerApplications)
    .where(eq(sellerApplications.userId, user.id));

  redirect(application ? '/become-seller/status' : '/choose-role');
}
