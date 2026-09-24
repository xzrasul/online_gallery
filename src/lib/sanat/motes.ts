// Drifting lights (gold, cream, rose, teal) that spiral into the vortex with a
// short tail and a twinkle. Drawn on their own canvas, capped at 1500px tall.
// They are soft blurs moving ~10px/s, so the canvas is kept at half resolution
// and redrawn at 30fps: a quarter of the pixels, half the frames, same look.
//
// The engine runs in a worker where the browser supports OffscreenCanvas: a
// main-thread animation loop would drag the page's whole rendering pipeline
// (styles, layers) through every frame; from a worker the page stays idle and
// every CSS animation runs on the compositor alone.
import { clamp } from '@/src/lib/sanat/swirl';

type Mote = { r: number; a: number; w: number; v: number; s: number; c: number; ph: number; tw: number };
type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const COLOURS = ['240,198,79', '244,239,224', '228,90,134', '140,199,208'];
const RES = 0.5;
const FRAME_MS = 1000 / 30;

// Frame scheduling for the main thread and for workers without requestAnimationFrame.
const raf = (cb: (t: number) => void): number =>
  typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame(cb)
    : (setTimeout(() => cb(performance.now()), FRAME_MS) as unknown as number);
const caf = (id: number) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(id) : clearTimeout(id));

function sprite(colour: string): AnyCanvas {
  const s: AnyCanvas = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(48, 48) : document.createElement('canvas');
  s.width = s.height = 48;
  const g = s.getContext('2d') as Ctx2D;
  const gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
  gr.addColorStop(0, `rgba(${colour},1)`);
  gr.addColorStop(0.22, `rgba(${colour},.6)`);
  gr.addColorStop(1, `rgba(${colour},0)`);
  g.fillStyle = gr;
  g.fillRect(0, 0, 48, 48);
  return s;
}

export type MotesEngine = ReturnType<typeof createMotesEngine>;

// The simulation and drawing; knows nothing about the DOM.
export function createMotesEngine(canvas: AnyCanvas) {
  const ctx = canvas.getContext('2d') as Ctx2D | null;
  const motes: Mote[] = [];
  const sprites = COLOURS.map(sprite);
  let MW = 0,
    MH = 0,
    CX = 0,
    CY = 0,
    R0S = 110,
    lastT = 0,
    job = 0;

  const rmax = () => Math.min(900, R0S * 3.4 + 260);
  function spawn(m: Mote, initial: boolean) {
    const rm = rmax();
    m.r = initial ? R0S * 1.05 + Math.random() * (rm - R0S * 1.05) : rm * (0.93 + Math.random() * 0.07);
    m.a = Math.random() * Math.PI * 2;
    m.w = 0.26 + Math.random() * 0.3;
    m.v = 5 + Math.random() * 11;
    m.s = 14 + Math.random() * 30;
    m.c = Math.random() < 0.5 ? 0 : Math.random() < 0.5 ? 1 : Math.random() < 0.6 ? 2 : 3;
    m.ph = Math.random() * 6.28;
    m.tw = 1.5 + Math.random() * 2.5;
  }

  function frame(t: number) {
    job = raf(frame);
    if (!ctx || t - lastT < FRAME_MS - 2) return;
    const dt = Math.min(0.08, (t - lastT) / 1000 || 0);
    lastT = t;
    ctx.setTransform(RES, 0, 0, RES, 0, 0);
    ctx.clearRect(0, 0, MW, MH);
    ctx.globalCompositeOperation = 'lighter';
    const rm = rmax(),
      sec = t / 1000;
    for (const m of motes) {
      const k = Math.pow(R0S / m.r, 0.55);
      m.a += m.w * k * dt;
      m.r -= m.v * (0.6 + R0S / m.r) * dt;
      if (m.r < R0S * 1.02) {
        spawn(m, false);
        continue;
      }
      let al =
        clamp((rm - m.r) / 90, 0, 1) *
        clamp((m.r - R0S * 1.02) / 60, 0, 1) *
        (0.65 + 0.35 * Math.sin(sec * m.tw + m.ph)) *
        1.15;
      if (al > 1) al = 1;
      if (al < 0.02) continue;
      const spr = sprites[m.c];
      for (let j = 0; j < 3; j++) {
        const back = j * 0.2,
          a = m.a - m.w * k * back,
          rr = m.r + m.v * back * 1.4;
        const x = CX + Math.cos(a) * rr,
          y = CY + Math.sin(a) * rr,
          sz = m.s * (1 - j * 0.26);
        if (y < -30 || y > MH + 30) continue;
        ctx.globalAlpha = al * (1 - j * 0.38);
        ctx.drawImage(spr, x - sz / 2, y - sz / 2, sz, sz);
      }
    }
    ctx.globalAlpha = 1;
  }

  return {
    // Resize (height capped at 1500px) and aim at the vortex centre.
    update(W: number, H: number, cx: number, cy: number, r: number) {
      CX = cx;
      CY = cy;
      R0S = r;
      const h = Math.round(Math.min(H, 1500)),
        w = Math.round(W);
      if (MW !== w || MH !== h) {
        MW = w;
        MH = h;
        canvas.width = Math.ceil(w * RES);
        canvas.height = Math.ceil(h * RES);
      }
      const n = Math.round(clamp(W / 15, 26, 84));
      while (motes.length < n) {
        const m = {} as Mote;
        spawn(m, true);
        motes.push(m);
      }
      motes.length = n;
    },
    setRunning(running: boolean) {
      if (running && !job) job = raf(frame);
      else if (!running && job) {
        caf(job);
        job = 0;
      }
    },
  };
}

export type MotesMessage =
  | { type: 'init'; canvas: OffscreenCanvas }
  | { type: 'update'; args: [number, number, number, number, number] }
  | { type: 'run'; running: boolean };

// The on-page player: hands the canvas to a worker when it can, otherwise
// runs the engine here. Runs only while the canvas is on screen and the tab visible.
export function createMotes(canvas: HTMLCanvasElement, makeWorker: () => Worker) {
  let worker: Worker | null = null;
  let local: MotesEngine | null = null;
  if (typeof canvas.transferControlToOffscreen === 'function' && typeof Worker !== 'undefined') {
    try {
      worker = makeWorker();
      const offscreen = canvas.transferControlToOffscreen();
      worker.postMessage({ type: 'init', canvas: offscreen } satisfies MotesMessage, [offscreen]);
    } catch {
      worker?.terminate();
      worker = null;
    }
  }
  if (!worker) local = createMotesEngine(canvas);
  let onScreen = true,
    running = false;
  const sync = () => {
    const next = onScreen && document.visibilityState === 'visible';
    if (next === running) return;
    running = next;
    if (worker) worker.postMessage({ type: 'run', running } satisfies MotesMessage);
    else local!.setRunning(running);
  };

  return {
    update(W: number, H: number, cx: number, cy: number, r: number) {
      canvas.style.height = Math.round(Math.min(H, 1500)) + 'px';
      if (worker) worker.postMessage({ type: 'update', args: [W, H, cx, cy, r] } satisfies MotesMessage);
      else local!.update(W, H, cx, cy, r);
    },
    setOnScreen(visible: boolean) {
      onScreen = visible;
      sync();
    },
    sync,
    stop() {
      running = false;
      if (worker) worker.postMessage({ type: 'run', running: false } satisfies MotesMessage);
      else local!.setRunning(false);
    },
  };
}
