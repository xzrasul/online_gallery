import Link from 'next/link';
import { KoshinBand } from '@/src/components/sanat/koshin-band';
import { LogoMark } from '@/src/components/sanat/logo-mark';
import { BRAND_NAME } from '@/src/lib/brand';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <KoshinBand />
      <div className="wrap">
        <div className="foot">
          <div>
            <Link href="/" className="logo">
              <LogoMark />
              <span>sanatplace</span>
            </Link>
            <p>Оригинальные картины напрямую от художников.</p>
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
