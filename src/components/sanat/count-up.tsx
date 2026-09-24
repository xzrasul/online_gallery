'use client';

import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/src/lib/sanat/reveal';

// Counts a price up from 0 over 1.7s (easeOutExpo). The server-rendered text
// is the final value, so without JS (or with reduced motion) it just shows.
export function CountUp({
  value,
  suffix,
  delay = 250,
  className,
}: {
  value: number;
  suffix: string;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    el.textContent = `0${suffix}`;
    const timer = window.setTimeout(() => {
      const t0 = performance.now(),
        D = 1700;
      const step = (now: number) => {
        const p = Math.min(1, Math.max(0, (now - t0) / D)),
          e = p >= 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = `${Math.round(value * e)}${suffix}`;
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      el.textContent = `${value}${suffix}`;
    };
  }, [value, suffix, delay]);
  return (
    <p className={className} ref={ref}>
      {`${value}${suffix}`}
    </p>
  );
}
