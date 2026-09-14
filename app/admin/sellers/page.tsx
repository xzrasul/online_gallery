import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users, sellerApplications } from '@/src/db/schema';
import { approveApplication, rejectApplication } from './actions';

export default async function AdminSellersPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [admin] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!admin || admin.role !== 'admin') redirect('/');

  const pending = await getDb()
    .select()
    .from(sellerApplications)
    .where(eq(sellerApplications.status, 'pending'));

  return (
    <main>
      <h1>Заявки продавцов на рассмотрении</h1>
      {pending.length === 0 && <p>Нет заявок на рассмотрении.</p>}
      {pending.map((application) => (
        <section key={application.id}>
          <h2>{application.displayName}</h2>
          <p>{application.bio}</p>
          <form action={approveApplication}>
            <input type="hidden" name="applicationId" value={application.id} />
            <button type="submit">Одобрить</button>
          </form>
          <form action={rejectApplication}>
            <input type="hidden" name="applicationId" value={application.id} />
            <input type="text" name="reason" placeholder="Причина отказа" />
            <button type="submit">Отклонить</button>
          </form>
        </section>
      ))}
    </main>
  );
}
