'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button, buttonVariants } from '@/src/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-md py-10 text-center">
      <h1 className="text-3xl">Что-то пошло не так</h1>
      <p className="mt-3 text-muted-foreground">
        Не удалось загрузить страницу. Попробуйте ещё раз чуть позже.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={reset}>Попробовать снова</Button>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          На главную
        </Link>
      </div>
    </main>
  );
}
