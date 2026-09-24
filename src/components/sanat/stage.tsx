'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { createMotes } from '@/src/lib/sanat/motes';
import { arm, prefersReducedMotion, REVEAL_SELECTOR } from '@/src/lib/sanat/reveal';
import { createSwirlPainter, type Centre } from '@/src/lib/sanat/swirl';

// transferControlToOffscreen works once per canvas; React's dev-mode double
// effect must reuse the painter and the lights instead of creating them twice.
const painters = new WeakMap<HTMLCanvasElement, ReturnType<typeof createSwirlPainter>>();
function painterFor(canvas: HTMLCanvasElement) {
  let painter = painters.get(canvas);
  if (!painter) {
    painter = createSwirlPainter(
      canvas,
      () => new Worker(new URL('../../lib/sanat/swirl.worker.ts', import.meta.url), { type: 'module' }),
    );
    painters.set(canvas, painter);
  }
  return painter;
}
const lights = new WeakMap<HTMLCanvasElement, ReturnType<typeof createMotes>>();
function motesFor(canvas: HTMLCanvasElement) {
  let motes = lights.get(canvas);
  if (!motes) {
    motes = createMotes(
      canvas,
      () => new Worker(new URL('../../lib/sanat/motes.worker.ts', import.meta.url), { type: 'module' }),
    );
    lights.set(canvas, motes);
  }
  return motes;
}

export type PageName = 'home' | 'catalog' | 'artwork' | 'signin' | 'other';

export function pageNameOf(pathname: string): PageName {
  if (pathname === '/') return 'home';
  if (pathname === '/gallery') return 'catalog';
  if (pathname.startsWith('/gallery/artwork/')) return 'artwork';
  if (pathname === '/sign-in') return 'signin';
  return 'other';
}

// Centre of the vortex from layout offsets (unaffected by transforms and reveals).
function centreOf(stage: HTMLElement): Centre {
  const el = stage.querySelector<HTMLElement>('[data-center]');
  if (!el || !el.offsetParent) return { x: stage.clientWidth * 0.75, y: 300, r: 28 };
  let x = 0,
    y = 0,
    n: HTMLElement | null = el;
  while (n && n !== stage) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return {
    x: x + el.offsetWidth / 2,
    y: y + el.offsetHeight / 2,
    r: (Math.min(el.offsetWidth, el.offsetHeight) / 2) * 0.98,
  };
}

type Last = { page: string; W: number; H: number; PH: number; cx: number; cy: number };

// One painted canvas under the whole site, plus the living layers on top of it:
// rotating beams, drifting lights and a warm glow that follows the mouse.
export function Stage({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const page = pageNameOf(pathname);
  const stageRef = useRef<HTMLDivElement>(null);
  const swirlRef = useRef<HTMLCanvasElement>(null);
  const motesRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ paint: (force: boolean, animate: boolean) => void; ready: boolean } | null>(null);

  // Canvas, motes, resize, pointer: set up once.
  useEffect(() => {
    const stage = stageRef.current!,
      cv = swirlRef.current!,
      mc = motesRef.current!;
    const RM = prefersReducedMotion();
    const FINE = !!window.matchMedia?.('(hover:hover) and (pointer:fine)').matches;
    const motes = RM ? null : motesFor(mc);
    const painter = painterFor(cv);
    let last: Last | null = null,
      timer = 0;

    const paint = (force: boolean, animate: boolean) => {
      const pageName = stage.getAttribute('data-page') ?? 'other';
      const W = Math.max(1, stage.clientWidth),
        H = Math.max(1, stage.clientHeight);
      const c = centreOf(stage);
      stage.style.setProperty('--cx', c.x + 'px');
      stage.style.setProperty('--cy', c.y + 'px');
      motes?.update(W, H, c.x, c.y, c.r);
      if (
        !force &&
        last &&
        last.page === pageName &&
        Math.abs(W - last.W) < 8 &&
        H <= last.PH - 30 &&
        H >= last.H - 700 &&
        Math.abs(c.x - last.cx) < 4 &&
        Math.abs(c.y - last.cy) < 4
      )
        return;
      last = { page: pageName, W, H, PH: H + 600, cx: c.x, cy: c.y };
      painter.paint({ width: W, height: H, centre: c, animate: animate && !RM, small: window.innerWidth < 700 });
    };
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => api.current?.ready && paint(false, false), 120);
    };
    api.current = { paint, ready: false };

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    if (ro) ro.observe(stage);
    else window.addEventListener('resize', schedule);
    // Lights only run while their canvas is on screen and the tab is visible.
    const motesIo =
      motes && 'IntersectionObserver' in window
        ? new IntersectionObserver(([e]) => motes.setOnScreen(e.isIntersecting))
        : null;
    if (motesIo) motesIo.observe(mc);
    else motes?.setOnScreen(true);
    const onVisibility = () => motes?.sync();
    document.addEventListener('visibilitychange', onVisibility);

    // First paint waits for the fonts (at most 900ms) so the centre is where it will stay.
    let alive = true;
    const boot = () => {
      if (!alive || api.current?.ready) return;
      api.current!.ready = true;
      paint(true, true);
    };
    if (document.fonts?.ready) {
      Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))]).then(boot, boot);
      document.fonts.ready.then(() => alive && schedule());
    } else boot();

    // Pointer: card tilt + glare, mandala parallax, warm light. Batched into one
    // frame, and the custom properties go on the elements that use them (never
    // the stage: an inherited property there restyles the whole page).
    const spot = stage.querySelector<HTMLElement>(':scope > .spot');
    let pr = 0,
      pxv = 0,
      pyv = 0,
      target: Element | null = null,
      tilt: HTMLElement | null = null;
    const untilt = (c: HTMLElement | null) => {
      c?.style.removeProperty('--rx');
      c?.style.removeProperty('--ry');
    };
    const onFrame = () => {
      pr = 0;
      const c = target?.closest?.<HTMLElement>('.card') ?? null;
      if (c !== tilt) {
        untilt(tilt);
        tilt = c;
      }
      if (c) {
        const r = c.getBoundingClientRect(),
          px = (pxv - r.left) / r.width,
          py = (pyv - r.top) / r.height;
        c.style.setProperty('--ry', ((px - 0.5) * 11).toFixed(2) + 'deg');
        c.style.setProperty('--rx', ((0.5 - py) * 9).toFixed(2) + 'deg');
        c.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        c.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      }
      const mx = ((pxv / window.innerWidth - 0.5) * 2).toFixed(3),
        my = ((pyv / window.innerHeight - 0.5) * 2).toFixed(3);
      stage.querySelectorAll<HTMLElement>('.mandala').forEach((m) => {
        m.style.setProperty('--mx', mx);
        m.style.setProperty('--my', my);
      });
      if (spot) {
        spot.style.setProperty('--px', pxv + 'px');
        spot.style.setProperty('--py', pyv + 'px');
      }
      stage.classList.add('moved');
    };
    const onMove = (e: PointerEvent) => {
      pxv = e.clientX;
      pyv = e.clientY;
      target = e.target as Element | null;
      if (!pr) pr = requestAnimationFrame(onFrame);
    };
    const onLeave = () => {
      untilt(tilt);
      tilt = null;
    };
    if (FINE && !RM) {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('mouseleave', onLeave);
    }

    // A click on a link to the page we are on: scroll smoothly to the top instead.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.hash) return;
      if (url.pathname === location.pathname && url.search === location.search) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });
      }
    };
    document.addEventListener('click', onClick, true);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      ro?.disconnect();
      window.removeEventListener('resize', schedule);
      motesIo?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motes?.stop();
      cancelAnimationFrame(pr);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('click', onClick, true);
      api.current = null;
    };
  }, []);

  // Every page: arm the scroll reveal before paint, then repaint the vortex around the new centre.
  useLayoutEffect(() => {
    const stage = stageRef.current!;
    const disarm = arm(Array.from(stage.querySelectorAll(REVEAL_SELECTOR)), 60);
    const raf = requestAnimationFrame(() => {
      if (api.current?.ready) api.current.paint(true, true);
    });
    return () => {
      cancelAnimationFrame(raf);
      disarm();
    };
  }, [pathname]);

  return (
    <div className="stage" data-page={page} ref={stageRef}>
      <canvas className="swirl" ref={swirlRef} aria-hidden="true" />
      <div className="dim" aria-hidden="true" />
      <div className="beams" aria-hidden="true" />
      <canvas className="motes" ref={motesRef} aria-hidden="true" />
      <div className="spot" aria-hidden="true" />
      <div className="topfade" aria-hidden="true" />
      {children}
    </div>
  );
}
