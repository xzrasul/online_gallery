'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { WishCount } from '@/src/components/sanat/wish-count';
import { prefersReducedMotion } from '@/src/lib/sanat/reveal';

type Item = { href: string; label: string; current: (path: string) => boolean; wish?: boolean };

const under = (prefix: string) => (path: string) => path === prefix || path.startsWith(prefix + '/');

const ITEMS: Item[] = [
  { href: '/', label: 'Главная', current: (p) => p === '/' },
  { href: '/gallery', label: 'Каталог', current: (p) => p === '/gallery' || p.startsWith('/gallery/artwork/') },
  { href: '/artists', label: 'Художники', current: (p) => under('/artists')(p) || p.startsWith('/gallery/artist/') },
  { href: '/sell', label: 'Продавцам', current: under('/sell') },
  { href: '/favorites', label: 'Wishlist', current: under('/favorites'), wish: true },
];

// The site menu: a round gold button fixed at the bottom right. The menu grows
// out of that corner; it closes on a link, on Escape (focus returns to the
// button), on a click elsewhere and when the page changes.
export function BurgerMenu({ signedIn, wishCount }: { signedIn: boolean; wishCount: number }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  const close = () => {
    if (!open) return;
    setOpen(false);
    if (!prefersReducedMotion()) setClosing(true);
  };

  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(() => setClosing(false), 170);
    return () => window.clearTimeout(t);
  }, [closing]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- close whenever the page changes
  useEffect(() => close(), [pathname]);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector('a')?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !button.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  // choosing a link (or "Выйти") closes the menu
  const onMenuClick = (e: MouseEvent) => {
    if ((e.target as Element).closest('a, button[type="submit"]')) close();
  };

  let i = 0;
  const step = () => ({ '--i': i++ }) as CSSProperties;

  return (
    <>
      <button
        ref={button}
        type="button"
        className="burger"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? 'Закрыть меню' : 'Меню'}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <svg className="b-o" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        <svg className="b-x" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <nav
        ref={menuRef}
        id={menuId}
        className={closing ? 'menu closing' : 'menu'}
        aria-label="Меню"
        hidden={!open && !closing}
        onClick={onMenuClick}
      >
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={step()}
            aria-current={item.current(pathname) ? 'page' : undefined}
          >
            {item.label}
            {item.wish && <WishCount initial={wishCount} signedIn={signedIn} />}
          </Link>
        ))}
        {signedIn ? (
          <>
            <Link href="/cabinet" style={step()} aria-current={under('/dashboard')(pathname) || under('/cabinet')(pathname) ? 'page' : undefined}>
              Личный кабинет
            </Link>
            <form action="/auth/sign-out" method="post" style={step()}>
              <button type="submit" className="menu-quiet">
                Выйти
              </button>
            </form>
          </>
        ) : (
          <Link className="login-l" href="/sign-in" style={step()}>
            Войти через Telegram
          </Link>
        )}
      </nav>
    </>
  );
}
