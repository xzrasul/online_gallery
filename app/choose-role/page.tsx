import { Button } from '@/src/components/ui/button';
import { BRAND_NAME } from '@/src/lib/brand';
import { safeNextPath } from '@/src/lib/auth/next-path';
import { chooseBuyer, chooseSeller } from './actions';

export default async function ChooseRolePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNextPath((await searchParams).next);
  return (
    <main className="mx-auto max-w-md pt-4 sm:pt-10">
      <div className="rounded-sm border border-border bg-card p-6 sm:p-8">
        <h1 className="text-2xl">Как вы хотите использовать {BRAND_NAME}?</h1>
        <div className="mt-6 grid gap-3">
          <form action={chooseBuyer}>
            {next && <input type="hidden" name="next" value={next} />}
            <Button type="submit" size="lg" className="w-full">
              Я покупатель
            </Button>
          </form>
          <form action={chooseSeller}>
            <Button type="submit" size="lg" variant="outline" className="w-full">
              Хочу продавать картины
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
