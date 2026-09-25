// Reveal on scroll: grid cards rise and fade in as they enter the viewport;
// cards in a row are staggered by 130ms. Once done, the attribute is
// dropped so it never fights with hover. State lives in attributes, not classes:
// React re-renders className (e.g. the filters opening) and would wipe a class.

export const CARD_SELECTOR = '.card';

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// Stagger for every card: 130ms along a row, 60ms per row. All reads happen
// here, before any attribute is written, so the page's styles are computed once
// (reading layout between writes would recompute them for every card).
function cardDelays(elements: Element[]) {
  const delays = new Map<Element, number>();
  const grids = new Map<Element, { cards: Element[]; cols: number }>();
  for (const el of elements) {
    if (!el.matches(CARD_SELECTOR)) continue;
    const grid = el.closest('.cards');
    if (!grid) continue;
    let g = grids.get(grid);
    if (!g) {
      g = {
        cards: Array.from(grid.querySelectorAll(CARD_SELECTOR)),
        cols: Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').length),
      };
      grids.set(grid, g);
    }
    const i = g.cards.indexOf(el);
    delays.set(el, (i % g.cols) * 130 + Math.floor(i / g.cols) * 60);
  }
  return delays;
}

// Arms the given elements; `base` delays the first batch that comes into view.
// Returns a disarm function (disconnects the observer and shows anything pending).
export function arm(elements: Element[], base: number): () => void {
  if (prefersReducedMotion() || !('IntersectionObserver' in window) || elements.length === 0) return () => {};
  let first = true;
  const timers = new Set<number>();
  const finish = (el: HTMLElement) => {
    el.removeAttribute('data-reveal');
    el.style.removeProperty('--rd');
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target as HTMLElement;
      io.unobserve(el);
      const d = (first ? base : 0) + (Number(el.getAttribute('data-rd')) || 0);
      el.style.setProperty('--rd', d + 'ms');
      el.setAttribute('data-reveal', 'in');
      const t = window.setTimeout(() => {
        timers.delete(t);
        finish(el);
      }, d + 2000);
      timers.add(t);
    }
    first = false;
  });
  const delays = cardDelays(elements);
  for (const el of elements) {
    el.setAttribute('data-rd', String(delays.get(el) ?? 0));
    el.setAttribute('data-reveal', '');
    io.observe(el);
  }
  return () => {
    io.disconnect();
    timers.forEach((t) => window.clearTimeout(t));
    for (const el of elements) if (el.hasAttribute('data-reveal')) finish(el as HTMLElement);
  };
}
