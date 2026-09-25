import Link from 'next/link';
import { getDb } from '@/src/db';
import { getCurrentUser } from '@/src/lib/auth/session';
import { countFavorites } from '@/src/lib/likes/likes';
import { UserAvatar } from '@/src/components/user-avatar';
import { HeartIcon } from '@/src/components/likes/like-button';
import { BurgerMenu } from '@/src/components/sanat/burger-menu';
import { LogoMark } from '@/src/components/sanat/logo-mark';
import { WishCount } from '@/src/components/sanat/wish-count';

// A floating pill: logo, search, the wishlist heart and sign-in (or the
// cabinet). The site's links live in the burger menu at the bottom right.
export async function SiteHeader() {
  const user = await getCurrentUser();
  const wishCount = user ? await countFavorites(getDb(), user.id).catch(() => 0) : 0;

  return (
    <>
      <header className="nav">
        <Link href="/" className="logo">
          <LogoMark />
          <span>sanatplace</span>
        </Link>
        <div className="nav-end">
          <form className="hsearch" action="/gallery" role="search">
            <input type="search" name="q" placeholder="Поиск картин" aria-label="Поиск картин" autoComplete="off" />
          </form>
          <Link className="iconbtn" href="/favorites" aria-label="Wishlist" title="Wishlist">
            <HeartIcon />
            <WishCount initial={wishCount} signedIn={Boolean(user)} />
          </Link>
          {user ? (
            <Link className="iconbtn avatar-btn" href="/cabinet" aria-label="Личный кабинет" title="Личный кабинет">
              <UserAvatar fullName={user.fullName} photoUrl={user.photoUrl} className="size-11" />
            </Link>
          ) : (
            <Link className="btn sm" href="/sign-in" aria-label="Войти через Telegram">
              Войти<span className="tgtxt">&nbsp;через Telegram</span>
            </Link>
          )}
        </div>
      </header>
      <BurgerMenu signedIn={Boolean(user)} wishCount={wishCount} />
    </>
  );
}
