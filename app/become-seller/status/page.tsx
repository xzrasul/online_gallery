import { getCurrentUser } from '@/src/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { sellerApplications } from '@/src/db/schema';
import { buttonVariants } from '@/src/components/ui/button';

export default async function SellerApplicationStatusPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');

  const [application] = await getDb()
    .select()
    .from(sellerApplications)
    .where(eq(sellerApplications.userId, user.id));

  if (!application) redirect('/become-seller');

  return (
    <main className="mx-auto max-w-lg pt-4 sm:pt-10">
      <div className="rounded-sm border border-border bg-card p-6 sm:p-8">
        <h1 className="text-2xl">Статус заявки продавца</h1>
        {application.status === 'pending' && <p className="mt-4">Ваша заявка на рассмотрении.</p>}
        {application.status === 'approved' && (
          <p className="mt-4">Заявка одобрена! Переходите в личный кабинет.</p>
        )}
        {application.status === 'rejected' && (
          <>
            <p className="mt-4">Заявка отклонена. Причина: {application.rejectionReason}</p>
            <Link href="/become-seller" className={buttonVariants({ variant: 'outline' }) + ' mt-6'}>
              Отправить заявку заново
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
