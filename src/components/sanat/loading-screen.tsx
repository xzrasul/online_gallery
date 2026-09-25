'use client';

import { useEffect, useRef, useState } from 'react';
import { SuzaniMandala } from '@/src/components/sanat/mandala';
import { SEEN_KEY } from '@/src/lib/sanat/loading';
import { prefersReducedMotion } from '@/src/lib/sanat/reveal';

const within = (p: Promise<unknown>, ms: number) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);

function backgroundReady() {
  const img = document.getElementById('bg-img') as HTMLImageElement | null;
  if (!img || !img.decode) return Promise.resolve();
  if (img.complete && img.naturalWidth) return img.decode().catch(() => {});
  return new Promise<void>((resolve) => {
    img.addEventListener('load', () => img.decode().then(resolve, resolve), { once: true });
    img.addEventListener('error', () => resolve(), { once: true });
  });
}

// First visit only: the spinning suzani vortex and a progress bar, shown for at
// least 1.6s while the fonts and the painted background load, then faded out.
export function LoadingScreen() {
  const [gone, setGone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.load !== 'loading') {
      setGone(true);
      return;
    }
    const RM = prefersReducedMotion();
    const timers: number[] = [];
    let alive = true;
    Promise.all([within(document.fonts?.ready ?? Promise.resolve(), 2500), within(backgroundReady(), 3500)]).then(() => {
      if (!alive) return;
      // performance.now() counts from the start of the navigation
      const wait = Math.max(0, (RM ? 250 : 1600) - performance.now());
      timers.push(
        window.setTimeout(() => {
          ref.current?.classList.add('fin');
          timers.push(
            window.setTimeout(
              () => {
                ref.current?.classList.add('done');
                html.dataset.load = 'done';
                try {
                  sessionStorage.setItem(SEEN_KEY, '1');
                } catch {}
                timers.push(window.setTimeout(() => setGone(true), RM ? 0 : 700));
              },
              RM ? 0 : 260,
            ),
          );
        }, wait),
      );
    });
    // (data-load stays 'loading' on a dev-mode re-run of this effect, so the loader still runs)
    return () => {
      alive = false;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  if (gone) return null;
  return (
    <div className="loader" ref={ref} role="status" aria-label="Загрузка">
      <div className="loader-in">
        <div className="loader-m">
          <SuzaniMandala />
        </div>
        <p className="loader-word" aria-hidden="true">
          sanat<em>place</em>
        </p>
        <div className="loader-bar" aria-hidden="true">
          <i />
        </div>
      </div>
    </div>
  );
}
