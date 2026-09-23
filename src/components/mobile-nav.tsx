'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/src/components/ui/sheet';
import { UserAvatar } from '@/src/components/user-avatar';

const linkClass = 'block rounded-md px-3 py-3 text-base hover:bg-accent';

export function MobileNav({ user }: { user: { fullName: string; photoUrl: string | null } | null }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Меню"
        className="inline-flex size-10 items-center justify-center rounded-md hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring md:hidden"
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
          {user ? (
            <>
              <Link href="/cabinet" onClick={close} className={`${linkClass} flex items-center gap-3`}>
                <UserAvatar fullName={user.fullName} photoUrl={user.photoUrl} />
                Личный кабинет
              </Link>
              <form action="/auth/sign-out" method="post">
                <button type="submit" className={`${linkClass} w-full text-left text-muted-foreground`}>
                  Выйти
                </button>
              </form>
            </>
          ) : (
            <Link href="/sign-in" onClick={close} className={linkClass}>
              Войти через Telegram
            </Link>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
