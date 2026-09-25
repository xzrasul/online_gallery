'use client';

import { Children, useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';

// How long a slide stays; the dot under it fills up over the same time.
const DURATION_MS = 5500;
const SWIPE_PX = 40;

// The home page banner: slides stacked on top of each other, cross-fading.
// It moves on by itself every 5.5 s and holds still while the pointer is over
// it, while something inside has focus, and while the tab is hidden. Arrows
// (desktop), dots, a swipe (phones) and the ← → keys change the slide. With a
// single slide there is nothing to move: no dots, arrows or timer.
export function HeroCarousel({
  labels,
  overlays,
  children,
}: {
  labels: string[];
  overlays: (number | null)[];
  children: ReactNode;
}) {
  const slides = Children.toArray(children);
  const n = slides.length;
  const [i, setI] = useState(0);
  // bumped on every (re)start so the dot's fill animation starts over
  const [run, setRun] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const held = hovered || focused || tabHidden;
  const touchX = useRef<number | null>(null);

  const show = useCallback(
    (k: number) => {
      setI(((k % n) + n) % n);
      setRun((r) => r + 1);
    },
    [n],
  );

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // coming back from a pause starts the current slide's time over
  const wasHeld = useRef(held);
  useEffect(() => {
    if (wasHeld.current && !held) setRun((r) => r + 1);
    wasHeld.current = held;
  }, [held]);

  useEffect(() => {
    if (n < 2 || held) return;
    const t = window.setTimeout(() => show(i + 1), DURATION_MS);
    return () => window.clearTimeout(t);
  }, [i, run, held, n, show]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (n < 2) return;
    if (e.key === 'ArrowRight') show(i + 1);
    else if (e.key === 'ArrowLeft') show(i - 1);
  };

  return (
    <section
      className={held ? 'hero paused' : 'hero'}
      aria-roledescription="карусель"
      aria-label="Баннеры"
      style={{ '--dur': `${DURATION_MS}ms` } as CSSProperties}
      // a mouse only: a tap on a phone would "enter" and never leave
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHovered(false)}
      // keyboard focus holds the slide; a tap or click on a dot does not
      onFocus={(e) => e.target.matches(':focus-visible') && setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={onKeyDown}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null || n < 2) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > SWIPE_PX) show(i + (dx < 0 ? 1 : -1));
      }}
    >
      {slides.map((slide, k) => {
        const o = overlays[k];
        // the admin's darkening (0–80, default 45) scales the gradient
        const style =
          o === null
            ? undefined
            : ({
                '--o1': Math.min(0.95, (0.55 * o) / 45).toFixed(3),
                '--o2': Math.min(0.95, (0.38 * o) / 45).toFixed(3),
                '--o3': Math.min(0.95, (0.65 * o) / 45).toFixed(3),
              } as CSSProperties);
        const on = k === i;
        return (
          <div
            key={k}
            className={`slide${on ? ' on' : ''}${o === null ? ' fallback' : ''}`}
            style={style}
            role="group"
            aria-roledescription="слайд"
            aria-label={n > 1 ? `${k + 1} из ${n}: ${labels[k]}` : labels[k]}
            aria-hidden={!on}
            inert={!on}
          >
            {slide}
          </div>
        );
      })}
      {n > 1 && (
        <>
          <button className="hero-arrow prev" type="button" aria-label="Предыдущий баннер" onClick={() => show(i - 1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button className="hero-arrow next" type="button" aria-label="Следующий баннер" onClick={() => show(i + 1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="hero-dots" role="group" aria-label="Выбор баннера">
            {slides.map((_, k) => (
              <button
                key={k}
                type="button"
                aria-label={`Баннер ${k + 1}: ${labels[k]}`}
                aria-current={k === i ? 'true' : undefined}
                onClick={() => show(k)}
              >
                <i key={k === i ? run : undefined} />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
