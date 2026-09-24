import Link from 'next/link';
import { getCurrentUser } from '@/src/lib/auth/session';
import { UserAvatar } from '@/src/components/user-avatar';
import { LogoMark } from '@/src/components/sanat/logo-mark';
import { NavLink } from '@/src/components/sanat/nav-link';

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="wrap nav">
      <Link href="/" className="logo">
        <LogoMark />
        <span>
          sanat<em>place</em>
        </span>
      </Link>
      <nav className="links" aria-label="Основная навигация">
        <NavLink href="/gallery">Каталог</NavLink>
        {user ? (
          <>
            <NavLink href="/cabinet" match="/dashboard">
              <UserAvatar fullName={user.fullName} photoUrl={user.photoUrl} />
              Личный кабинет
            </NavLink>
            <form action="/auth/sign-out" method="post">
              <button type="submit" className="link quiet">
                Выйти
              </button>
            </form>
          </>
        ) : (
          <Link href="/sign-in" className="btn sm">
            Войти через Telegram
          </Link>
        )}
      </nav>
    </header>
  );
}
