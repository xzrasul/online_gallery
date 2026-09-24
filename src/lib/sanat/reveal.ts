// Reveal on scroll: panels, bands and cards rise and fade in as they enter the
// viewport; cards in a row are staggered by 130ms. Once done, the attribute is
// dropped so it never fights with hover. State lives in attributes, not classes:
// React re-renders className (e.g. the filters opening) and would wipe a class.

export const REVEAL_SELECTOR = '.dband,.panel,.frame,.head-row,.back';
export const CARD_SELECTOR = '.card';

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function cardDelay(el: Element) {
  const grid = el.closest('.cards');
  if (!grid) return 0;
  const cards = Array.from(grid.querySelectorAll(CARD_SELECTOR));
  const i = cards.indexOf(el);
  const cols = Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').length);
  return (i % cols) * 130 + Math.floor(i / cols) * 60;
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
  for (const el of elements) {
    el.setAttribute('data-rd', String(el.matches(CARD_SELECTOR) ? cardDelay(el) : 0));
    el.setAttribute('data-reveal', '');
    io.observe(el);
  }
  return () => {
    io.disconnect();
    timers.forEach((t) => window.clearTimeout(t));
    for (const el of elements) if (el.hasAttribute('data-reveal')) finish(el as HTMLElement);
  };
}
