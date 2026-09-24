'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { arm, CARD_SELECTOR } from '@/src/lib/sanat/reveal';

// The card grid; its cards rise in as they scroll into view, 130ms apart in a
// row. Give it a new `key` (e.g. the filter query) to play the reveal again.
export function RevealCards({ base = 60, children }: { base?: number; children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  useLayoutEffect(() => arm(Array.from(ref.current!.querySelectorAll(CARD_SELECTOR)), base), [base]);
  return (
    <ul className="cards" ref={ref}>
      {children}
    </ul>
  );
}
