'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Show } from '@clerk/nextjs';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/src/components/ui/sheet';

const linkClass = 'block rounded-md px-3 py-3 text-base hover:bg-accent';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Меню"
        className="inline-flex size-10 items-center justify-center rounded-md hover:bg-accent md:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Меню</SheetTitle>
          <SheetDescription className="sr-only">Навигация по сайту</SheetDescription>
        </SheetHeader>
        <nav className="grid gap-1 px-2" aria-label="Мобильная навигация">
          <Link href="/gallery" onClick={close} className={linkClass}>
            Каталог
          </Link>
          <Show when="signed-out">
            <Link href="/sign-in" onClick={close} className={linkClass}>
              Войти
            </Link>
            <Link href="/sign-up" onClick={close} className={linkClass}>
              Регистрация
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/choose-role" onClick={close} className={linkClass}>
              Личный кабинет
            </Link>
          </Show>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
