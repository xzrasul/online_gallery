'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { arm, CARD_SELECTOR } from '@/src/lib/sanat/reveal';

// The card grid (4 → 3 → 2 columns); its cards rise in as they scroll into
// view, staggered along a row. Give it a new `key` to play the reveal again.
export function RevealCards({ base = 60, children }: { base?: number; children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  useLayoutEffect(() => arm(Array.from(ref.current!.querySelectorAll(CARD_SELECTOR)), base), [base]);
  return (
    <ul className="grid cards" ref={ref}>
      {children}
    </ul>
  );
}
