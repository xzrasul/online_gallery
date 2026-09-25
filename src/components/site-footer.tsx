import Link from 'next/link';
import { Logo } from '@/src/components/sanat/logo';
import { BRAND_NAME } from '@/src/lib/brand';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot">
          <div>
            <Logo />
          </div>
          <nav aria-label="Покупателям">
            <h4>Покупателям</h4>
            <Link href="/gallery">Каталог</Link>
            <Link href="/artists">Художники</Link>
            <Link href="/favorites">Wishlist</Link>
          </nav>
          <nav aria-label="Продавцам">
            <h4>Продавцам</h4>
            <Link href="/sell">Стать продавцом</Link>
            <Link href="/sign-in">Войти через Telegram</Link>
          </nav>
        </div>
        <div className="copy">
          <span>
            © {new Date().getFullYear()} {BRAND_NAME} — место для искусства
          </span>
          <span>
            санъат ·{' '}
            <span lang="fa" dir="rtl" className="fa">
              صنعت
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
