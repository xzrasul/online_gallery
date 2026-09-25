import { requireStaff } from '@/src/lib/auth/staff';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { sellerApplications } from '@/src/db/schema';
import { AdminNav } from '@/src/components/admin/admin-nav';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { approveApplication, rejectApplication } from './actions';

export default async function AdminSellersPage() {
  const role = await requireStaff();

  const pending = await getDb()
    .select()
    .from(sellerApplications)
    .where(eq(sellerApplications.status, 'pending'));

  return (
    <main>
      <AdminNav role={role} />
      <h1>Заявки продавцов на рассмотрении</h1>
      {pending.length === 0 && <p className="mt-4 text-muted-foreground">Нет заявок на рассмотрении.</p>}
      <div className="mt-6 grid max-w-2xl gap-4">
        {pending.map((application) => (
          <section key={application.id} className="rounded-sm border border-border bg-card p-5">
            <h2>{application.displayName}</h2>
            <p className="mt-2 whitespace-pre-line text-muted-foreground">{application.bio}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <form action={approveApplication}>
                <input type="hidden" name="applicationId" value={application.id} />
                <Button type="submit">Одобрить</Button>
              </form>
              <form action={rejectApplication} className="flex w-full gap-2 sm:w-auto sm:flex-1">
                <input type="hidden" name="applicationId" value={application.id} />
                <Input type="text" name="reason" placeholder="Причина отказа" aria-label="Причина отказа" />
                <Button type="submit" variant="outline">
                  Отклонить
                </Button>
              </form>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
