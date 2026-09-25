import Link from 'next/link';
import { requireStaff } from '@/src/lib/auth/staff';
import { getDb } from '@/src/db';
import { listAllBanners, MAX_ACTIVE_BANNERS, type Banner } from '@/src/lib/home/banners';
import { BANNER_ERRORS } from '@/src/lib/home/banner-form';
import { AdminNav } from '@/src/components/admin/admin-nav';
import { ConfirmDelete } from '@/src/components/admin/confirm-delete';
import { Button, buttonVariants } from '@/src/components/ui/button';
import { moveBannerAction, removeBanner, toggleBanner } from './actions';

export const metadata = { title: 'Баннеры' };

const when = (d: Date) =>
  d.toLocaleString('ru-RU', { timeZone: 'Asia/Dushanbe', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Active, off, or active but outside its show window right now.
function stateOf(b: Banner, now: Date) {
  if (!b.isActive) return { text: 'Выключен', live: false };
  if (b.startsAt && b.startsAt > now) return { text: `Покажется с ${when(b.startsAt)}`, live: false };
  if (b.endsAt && b.endsAt <= now) return { text: `Показ закончился ${when(b.endsAt)}`, live: false };
  return { text: b.endsAt ? `Активен до ${when(b.endsAt)}` : 'Активен', live: true };
}

export default async function AdminBannersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const role = await requireStaff('admin');
  const { error, saved } = await searchParams;
  const list = await listAllBanners(getDb());
  const active = list.filter((b) => b.isActive).length;
  const now = new Date();
  const message = error && error in BANNER_ERRORS ? BANNER_ERRORS[error as keyof typeof BANNER_ERRORS] : null;

  return (
    <main>
      <AdminNav role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>Баннеры на главной</h1>
          <p className="mt-2 text-muted-foreground">
            Слайды в верхней части главной страницы, сверху вниз — в порядке показа. Активных: {active} из{' '}
            {MAX_ACTIVE_BANNERS}. Без активных баннеров показывается стандартный зелёный слайд.
          </p>
        </div>
        <Link href="/admin/banners/new" className={buttonVariants()}>
          Добавить баннер
        </Link>
      </div>

      {message && (
        <p role="alert" className="notice err mt-6">
          {message}
        </p>
      )}
      {saved && !message && (
        <p role="status" className="notice mt-6">
          Сохранено. Главная страница обновится в течение минуты.
        </p>
      )}

      {list.length === 0 ? (
        <p className="mt-8 text-muted-foreground">Баннеров пока нет.</p>
      ) : (
        <ol className="mt-8 grid gap-4">
          {list.map((b, k) => {
            const state = stateOf(b, now);
            return (
              <li key={b.id} className="flex flex-wrap items-center gap-5 rounded-sm bg-card p-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- a small admin thumbnail */}
                <img src={b.imageUrl} alt="" className="banner-thumb" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">№ {k + 1}</p>
                  <h2 className="text-2xl">{b.title}</h2>
                  <p className={state.live ? 'mt-1 text-sm text-brand' : 'mt-1 text-sm text-muted-foreground'}>
                    {state.text}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <form action={moveBannerAction}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="dir" value="up" />
                    <Button type="submit" variant="outline" disabled={k === 0} aria-label={`Выше: ${b.title}`}>
                      Вверх
                    </Button>
                  </form>
                  <form action={moveBannerAction}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="dir" value="down" />
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={k === list.length - 1}
                      aria-label={`Ниже: ${b.title}`}
                    >
                      Вниз
                    </Button>
                  </form>
                  <form action={toggleBanner}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="active" value={b.isActive ? '0' : '1'} />
                    <Button type="submit" variant={b.isActive ? 'outline' : 'default'} aria-label={`${b.isActive ? 'Выключить' : 'Включить'}: ${b.title}`}>
                      {b.isActive ? 'Выключить' : 'Включить'}
                    </Button>
                  </form>
                  <Link href={`/admin/banners/${b.id}`} className={buttonVariants({ variant: 'outline' })}>
                    Изменить
                  </Link>
                  <ConfirmDelete action={removeBanner} id={b.id} what={b.title} />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
