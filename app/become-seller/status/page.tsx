import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users, sellerApplications } from '@/src/db/schema';

export default async function SellerApplicationStatusPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const [user] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!user) redirect('/sign-in');

  const [application] = await getDb()
    .select()
    .from(sellerApplications)
    .where(eq(sellerApplications.userId, user.id));

  if (!application) redirect('/become-seller');

  return (
    <main>
      <h1>Статус заявки продавца</h1>
      {application.status === 'pending' && <p>Ваша заявка на рассмотрении.</p>}
      {application.status === 'approved' && <p>Заявка одобрена! Переходите в личный кабинет.</p>}
      {application.status === 'rejected' && (
        <>
          <p>Заявка отклонена. Причина: {application.rejectionReason}</p>
          <a href="/become-seller">Отправить заявку заново</a>
        </>
      )}
    </main>
  );
}
