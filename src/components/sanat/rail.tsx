'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { prefersReducedMotion } from '@/src/lib/sanat/reveal';

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

// A horizontal strip of compact cards with prev/next arrows. Cards already on
// screen stay put; the ones waiting off to the right rise in when scrolled to.
export function Rail({ title, children }: { title: string; children: ReactNode }) {
  const rail = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = rail.current!;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdges({ start: el.scrollLeft < 4, end: el.scrollLeft > max - 4 });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  useLayoutEffect(() => {
    const el = rail.current!;
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          e.target.classList.add('in');
        }
      },
      { threshold: 0.12 },
    );
    const vw = window.innerWidth;
    for (const item of Array.from(el.children)) {
      if (item.getBoundingClientRect().left < vw - 16) continue;
      item.classList.add('rv');
      io.observe(item);
    }
    return () => io.disconnect();
  }, []);

  const scroll = (dir: number) => {
    const el = rail.current!;
    const card = el.querySelector<HTMLElement>('.card');
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 232) + 20), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <section className="sec" aria-labelledby="rail-title">
      <div className="sec-head">
        <h2 id="rail-title">{title}</h2>
        <div className="rbtns">
          <button className="rbtn prev" type="button" aria-label="Назад" disabled={edges.start} onClick={() => scroll(-1)}>
            <Arrow />
          </button>
          <button className="rbtn" type="button" aria-label="Дальше" disabled={edges.end} onClick={() => scroll(1)}>
            <Arrow />
          </button>
        </div>
      </div>
      <div className="rail" ref={rail} tabIndex={0} role="group" aria-label={title}>
        {children}
      </div>
    </section>
  );
}
