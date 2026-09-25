import { getCurrentUser } from '@/src/lib/auth/session';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { sellerApplications } from '@/src/db/schema';

// Личный кабинет: отправляет пользователя в кабинет, соответствующий его роли.
export default async function CabinetPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');

  // the admin area has its own sign-in now (login and password)
  if (user.role === 'admin') redirect('/sanatadmin');
  if (user.role === 'seller') redirect('/dashboard/seller');

  const [application] = await getDb()
    .select()
    .from(sellerApplications)
    .where(eq(sellerApplications.userId, user.id));

  redirect(application ? '/become-seller/status' : '/choose-role');
}
