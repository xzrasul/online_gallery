import { requireStaff } from '@/src/lib/auth/staff';
import { getDb } from '@/src/db';
import { listPublishedArtworks } from '@/src/lib/artworks/public-queries';
import { loadCollagePicks } from '@/src/lib/home/collage';
import { COLLAGE_SLOTS, COLLAGE_SLOT_LABELS, type CollageSlot } from '@/src/lib/home/collage-slots';
import { AdminNav } from '@/src/components/admin/admin-nav';
import { ArtworkImage } from '@/src/components/artwork/artwork-image';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { pickCollageWork, resetCollageSlot } from './actions';

const LIST_SIZE = 60;

export default async function AdminCollagePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const role = await requireStaff('admin');
  const q = (await searchParams).q?.trim() ?? '';

  const [picks, { items, total }] = await Promise.all([
    loadCollagePicks(getDb()),
    listPublishedArtworks(getDb(), { q }, { page: 1, pageSize: LIST_SIZE }),
  ]);
  const slotOf = new Map(Object.entries(picks).map(([slot, work]) => [work.id, slot as CollageSlot]));

  return (
    <main>
      <AdminNav role={role} />
      <h1>Коллаж на главной</h1>
      <p className="mt-2 text-muted-foreground">
        Три картины рядом с заголовком главной страницы. Место без выбора показывает самую новую работу.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {COLLAGE_SLOTS.map((slot) => {
          const work = picks[slot];
          return (
            <section key={slot} aria-label={COLLAGE_SLOT_LABELS[slot]} className="rounded-sm border border-border bg-card p-4">
              <h2 className="text-base">{COLLAGE_SLOT_LABELS[slot]}</h2>
              {work ? (
                <>
                  <ArtworkImage src={work.imageUrl} alt="" className="mt-3" sizes="240px" />
                  <p className="mt-2 truncate text-sm">{work.title}</p>
                  <form action={resetCollageSlot} className="mt-3">
                    <input type="hidden" name="slot" value={slot} />
                    <Button type="submit" variant="outline">
                      Авто
                    </Button>
                  </form>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Авто: самая новая работа</p>
              )}
            </section>
          );
        })}
      </div>

      <h2 className="mt-10">Опубликованные работы</h2>
      <form className="mt-3 flex gap-2" role="search">
        <Input type="search" name="q" defaultValue={q} placeholder="Название или художник" aria-label="Поиск работ" />
        <Button type="submit" variant="outline">
          Найти
        </Button>
      </form>
      {items.length === 0 && <p className="mt-4 text-muted-foreground">Ничего не найдено.</p>}
      {total > items.length && (
        <p className="mt-3 text-sm text-muted-foreground">
          Показаны {items.length} новых из {total}. Уточните поиск, чтобы найти остальные.
        </p>
      )}
      <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((work) => {
          const current = slotOf.get(work.id);
          return (
            <li key={work.id} className="rounded-sm border border-border bg-card p-3">
              <ArtworkImage src={work.imageUrl} alt="" sizes="200px" />
              <p className="mt-2 truncate text-sm" title={work.title}>
                {work.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">{work.sellerDisplayName}</p>
              {current && <p className="mt-1 text-xs text-brand">Сейчас: {COLLAGE_SLOT_LABELS[current]}</p>}
              <div className="mt-2 flex flex-wrap gap-1">
                {COLLAGE_SLOTS.filter((slot) => slot !== current).map((slot) => (
                  <form key={slot} action={pickCollageWork}>
                    <input type="hidden" name="slot" value={slot} />
                    <input type="hidden" name="artworkId" value={work.id} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      aria-label={`${COLLAGE_SLOT_LABELS[slot]}: ${work.title}`}
                    >
                      {COLLAGE_SLOT_LABELS[slot]}
                    </Button>
                  </form>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
