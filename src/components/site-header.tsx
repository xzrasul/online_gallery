import Link from 'next/link';
import { getCurrentUser } from '@/src/lib/auth/session';
import { UserAvatar } from '@/src/components/user-avatar';
import { LogoMark } from '@/src/components/sanat/logo-mark';
import { MobileMenu } from '@/src/components/sanat/mobile-menu';
import { NavLink } from '@/src/components/sanat/nav-link';

export async function SiteHeader() {
  const user = await getCurrentUser();
  // The same links, as a navbar on desktop and inside the burger menu on phones.
  const links = (
    <>
      <NavLink href="/gallery">Каталог</NavLink>
      {user ? (
        <>
          <NavLink href="/favorites">Избранное</NavLink>
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
    </>
  );
  return (
    <header className="wrap nav">
      <Link href="/" className="logo">
        <LogoMark />
        <span>
          sanat<em>place</em>
        </span>
      </Link>
      <nav className="links desk" aria-label="Основная навигация">
        {links}
      </nav>
      <MobileMenu>{links}</MobileMenu>
    </header>
  );
}
