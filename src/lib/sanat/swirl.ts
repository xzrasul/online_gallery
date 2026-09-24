// The painted "Starry Night" vortex behind the whole site: leaf-shaped brush
// strokes that spiral into the centre of the page's mandala. Deterministic
// (seeded), so every visit paints the same picture.

type Pair = readonly [fill: string, edge: string];

const NAVY: Pair[] = [
  ['#0A1B2C', '#1E4058'],
  ['#0E2A3D', '#2A5670'],
  ['#0B2233', '#22485E'],
  ['#102F40', '#2D6078'],
];
const TEAL: Pair[] = [
  ['#11454B', '#2E7E80'],
  ['#17595A', '#3F9A93'],
  ['#0F3F45', '#2B7378'],
];
const GREEN: Pair[] = [
  ['#1E5F3F', '#4FA372'],
  ['#2C7449', '#6DBF80'],
  ['#245A3A', '#5BAF78'],
];
const CYAN: Pair[] = [
  ['#3C7F92', '#8CC7D0'],
  ['#2E6E85', '#79B9CA'],
];
const LIME: Pair[] = [
  ['#9CA63A', '#DCE58C'],
  ['#B9BC48', '#EEF0A6'],
];
const MIST: Pair[] = [['#BFD9D0', '#F0F7F2']];

export const SEED = 20260923;

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

// mulberry32
export function rng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(x: number, y: number) {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

// value noise
function noise(x: number, y: number) {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    xf = x - xi,
    yf = y - yi,
    u = xf * xf * (3 - 2 * xf),
    v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi),
    b = hash(xi + 1, yi),
    c = hash(xi, yi + 1),
    d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function pick(l: Pair[], r: number) {
  return l[Math.floor(r * l.length) % l.length];
}

type Stroke = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  tx: number;
  ty: number;
  bx: number;
  by: number;
  c0: string;
  c1: string;
  t: number;
};

export type Centre = { x: number; y: number; r: number };

// Build the strokes for a W×PH canvas around the centre, sorted from the
// centre outwards (with noise) so they can be drawn in that order.
function strokes(W: number, PH: number, { x: cx, y: cy, r: R0 }: Centre): Stroke[] {
  const want = (W * PH) / 70,
    N = Math.round(Math.min(want, 42000)),
    k = Math.sqrt(want / Math.max(N, 1)),
    S: Stroke[] = [];
  const rnd = rng(SEED),
    scale = Math.max(0.75, Math.min(1.15, W / 1300)) * k;
  for (let n = 0; n < N; n++) {
    const x = rnd() * W,
      y = rnd() * PH,
      dx = x - cx,
      dy = y - cy,
      r = Math.sqrt(dx * dx + dy * dy);
    if (r < R0) continue;
    const th = Math.atan2(dy, dx),
      phase = th * 2 + Math.log(r / R0) * 3.4;
    const band = 0.5 + 0.5 * Math.sin(phase + noise(x * 0.006, y * 0.006) * 3);
    const v = Math.pow(band * 0.62 + noise(x * 0.012 + 9, y * 0.012) * 0.38, 1.15) + (rnd() - 0.5) * 0.22;
    let pal: Pair[];
    if (v < 0.3) pal = NAVY;
    else if (v < 0.5) pal = TEAL;
    else if (v < 0.72) pal = GREEN;
    else if (v < 0.86) pal = CYAN;
    else pal = LIME;
    if (rnd() < 0.012) pal = MIST;
    if (pal === LIME && rnd() < 0.55) pal = GREEN;
    const col = pick(pal, rnd());
    const phi = th + Math.PI / 2 + 0.6 + 0.28 * Math.sin(r * 0.006 + th) + (noise(x * 0.02, y * 0.02) - 0.5) * 0.5;
    const L = (24 + Math.min(r, 900) * 0.03 + rnd() * 34) * scale,
      w = (8 + rnd() * 9 + Math.min(r, 900) * 0.005) * scale;
    const ca = Math.cos(phi),
      sa = Math.sin(phi),
      nx = -sa,
      ny = ca,
      bend = L * 0.1;
    S.push({
      x0: x - (ca * L) / 2,
      y0: y - (sa * L) / 2,
      x1: x + (ca * L) / 2,
      y1: y + (sa * L) / 2,
      tx: x + nx * (w * 0.7 + bend),
      ty: y + ny * (w * 0.7 + bend),
      bx: x + nx * (-w * 0.7 + bend),
      by: y + ny * (-w * 0.7 + bend),
      c0: col[0],
      c1: col[1],
      t: r + hash(x * 0.37, y * 0.53) * 280,
    });
  }
  S.sort((a, b) => a.t - b.t);
  return S;
}

// A leaf: two quadratic curves, a light crest (alpha .55) and a dark shadow edge (alpha .4).
function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
  ctx.beginPath();
  ctx.moveTo(s.x0, s.y0);
  ctx.quadraticCurveTo(s.tx, s.ty, s.x1, s.y1);
  ctx.quadraticCurveTo(s.bx, s.by, s.x0, s.y0);
  ctx.fillStyle = s.c0;
  ctx.fill();
  ctx.lineWidth = 0.9;
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = s.c1;
  ctx.beginPath();
  ctx.moveTo(s.x0, s.y0);
  ctx.quadraticCurveTo(s.tx, s.ty, s.x1, s.y1);
  ctx.stroke();
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = '#050d16';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(s.x0, s.y0);
  ctx.quadraticCurveTo(s.bx, s.by, s.x1, s.y1);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// The canvas is painted 600px taller than the page so filters opening and
// closing never force a repaint.
export const OVERSCAN = 600;

export type PaintOptions = {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  centre: Centre;
  animate: boolean;
  small: boolean;
};

// Paints the vortex; with `animate`, strokes appear from the centre outwards
// (1.8s, 1.3s on phones) while the canvas settles in. Returns a cancel function.
export function paintSwirl({ canvas, width: W, height: H, centre, animate, small }: PaintOptions): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const PH = H + OVERSCAN;
  let dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(6e6 / (W * PH)));
  dpr = Math.max(dpr, 0.75);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(PH * dpr);
  canvas.style.height = PH + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = 'round';
  ctx.fillStyle = '#08141F';
  ctx.fillRect(0, 0, W, PH);

  const S = strokes(W, PH, centre);
  const many = (a: number, b: number) => {
    for (let i = a; i < b; i++) drawStroke(ctx, S[i]);
  };
  if (!animate) {
    many(0, S.length);
    return () => {};
  }

  canvas.style.transformOrigin = `${centre.x}px ${centre.y}px`;
  const settle = canvas.animate?.(
    [
      { transform: 'scale(1.07)', opacity: 0.35 },
      { transform: 'scale(1)', opacity: 1 },
    ],
    { duration: 2000, easing: 'cubic-bezier(.2,.8,.2,1)' },
  );
  const t0 = performance.now(),
    D = small ? 1300 : 1800;
  let done = 0,
    job = 0;
  const step = (now: number) => {
    const p = clamp((now - t0) / D, 0, 1),
      to = Math.floor(S.length * (1 - Math.pow(1 - p, 1.55)));
    if (to > done) {
      many(done, to);
      done = to;
    }
    if (p < 1) job = requestAnimationFrame(step);
    else if (done < S.length) many(done, S.length);
  };
  step(t0);
  return () => {
    cancelAnimationFrame(job);
    settle?.cancel();
  };
}
