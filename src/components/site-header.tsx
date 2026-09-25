import { getDb } from '@/src/db';
import { getCurrentUser } from '@/src/lib/auth/session';
import { countFavorites } from '@/src/lib/likes/likes';
import { BurgerMenu } from '@/src/components/sanat/burger-menu';
import { Logo } from '@/src/components/sanat/logo';

// The logo on the left, the menu button on the right; everything else lives in
// the menu. On the home page the header lies over the banner (see .stage:has(.hero)).
export async function SiteHeader() {
  const user = await getCurrentUser();
  const wishCount = user ? await countFavorites(getDb(), user.id).catch(() => 0) : 0;

  return (
    <header className="nav">
      <Logo />
      <BurgerMenu signedIn={Boolean(user)} wishCount={wishCount} />
    </header>
  );
}
