import Link from 'next/link';
import { Show, UserButton } from '@clerk/nextjs';
import { buttonVariants } from '@/src/components/ui/button';
import { MobileNav } from '@/src/components/mobile-nav';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Галерея
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Основная навигация">
          <Link href="/gallery" className="text-sm hover:text-brand">
            Каталог
          </Link>
          <Show when="signed-out">
            <Link href="/sign-in" className="text-sm hover:text-brand">
              Войти
            </Link>
            <Link href="/sign-up" className={buttonVariants({ size: 'sm' })}>
              Регистрация
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/choose-role" className="text-sm hover:text-brand">
              Личный кабинет
            </Link>
            <UserButton />
          </Show>
        </nav>
        <MobileNav />
      </div>
    </header>
  );
}
