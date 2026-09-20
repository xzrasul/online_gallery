import Link from 'next/link';
import { buttonVariants } from '@/src/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md py-10 text-center">
      <h1 className="text-3xl">Страница не найдена</h1>
      <p className="mt-3 text-muted-foreground">Такой страницы нет или она была удалена.</p>
      <Link href="/gallery" className={buttonVariants({ className: 'mt-6' })}>
        Перейти в каталог
      </Link>
    </main>
  );
}
