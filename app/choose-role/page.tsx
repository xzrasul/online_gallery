import { Button } from '@/src/components/ui/button';
import { chooseBuyer, chooseSeller } from './actions';

export default function ChooseRolePage() {
  return (
    <main className="mx-auto max-w-md pt-4 sm:pt-10">
      <div className="rounded-sm border border-border bg-card p-6 sm:p-8">
        <h1 className="text-2xl">Как вы хотите использовать галерею?</h1>
        <div className="mt-6 grid gap-3">
          <form action={chooseBuyer}>
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
