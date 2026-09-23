import Link from 'next/link';
import { getCurrentUser } from '@/src/lib/auth/session';
import { buttonVariants } from '@/src/components/ui/button';
import { MobileNav } from '@/src/components/mobile-nav';
import { UserAvatar } from '@/src/components/user-avatar';
import { BrandWordmark } from '@/src/components/brand-wordmark';

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg">
          <BrandWordmark />
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Основная навигация">
          <Link href="/gallery" className="text-sm hover:text-brand">
            Каталог
          </Link>
          {user ? (
            <>
              <Link href="/cabinet" className="flex items-center gap-2 text-sm hover:text-brand">
                <UserAvatar fullName={user.fullName} photoUrl={user.photoUrl} />
                Личный кабинет
              </Link>
              <form action="/auth/sign-out" method="post">
                <button type="submit" className="text-sm text-muted-foreground hover:text-brand">
                  Выйти
                </button>
              </form>
            </>
          ) : (
            <Link href="/sign-in" className={buttonVariants({ size: 'sm' })}>
              Войти через Telegram
            </Link>
          )}
        </nav>
        <MobileNav user={user && { fullName: user.fullName, photoUrl: user.photoUrl }} />
      </div>
    </header>
  );
}
