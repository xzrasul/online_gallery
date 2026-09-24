'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from 'react';

// The header links on phones and tablets: a burger button that opens a panel
// under the header. It closes when a link is chosen, on Escape (focus returns
// to the button), on a click outside and when the page changes.
export function MobileMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  // choosing a link (or "Выйти") closes the menu
  const onPanelClick = (e: MouseEvent) => {
    if ((e.target as Element).closest('a, button[type="submit"]')) setOpen(false);
  };

  return (
    <div className="mobile-nav" ref={root}>
      <button
        ref={button}
        type="button"
        className={open ? 'burger open' : 'burger'}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Закрыть меню' : 'Меню'}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
      <nav id={panelId} className="mobile-menu" aria-label="Меню" hidden={!open} onClick={onPanelClick}>
        {children}
      </nav>
    </div>
  );
}
