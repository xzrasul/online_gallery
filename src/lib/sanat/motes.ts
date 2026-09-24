// Drifting lights (gold, cream, rose, teal) that spiral into the vortex with a
// short tail and a twinkle. Drawn on their own canvas, capped at 1500px tall.
import { clamp } from '@/src/lib/sanat/swirl';

type Mote = { r: number; a: number; w: number; v: number; s: number; c: number; ph: number; tw: number };

const COLOURS = ['240,198,79', '244,239,224', '228,90,134', '140,199,208'];

export function createMotes(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  const motes: Mote[] = [];
  const sprites = COLOURS.map((c) => {
    const s = document.createElement('canvas');
    s.width = s.height = 48;
    const g = s.getContext('2d')!;
    const gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
    gr.addColorStop(0, `rgba(${c},1)`);
    gr.addColorStop(0.22, `rgba(${c},.6)`);
    gr.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, 48, 48);
    return s;
  });
  let MW = 0,
    MH = 0,
    CX = 0,
    CY = 0,
    R0S = 110,
    lastT = 0,
    raf = 0;

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
    raf = requestAnimationFrame(frame);
    if (!ctx) return;
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0);
    lastT = t;
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
    // Resize to the stage (height capped at 1500px) and aim at the vortex centre.
    update(W: number, H: number, cx: number, cy: number, r: number) {
      CX = cx;
      CY = cy;
      R0S = r;
      const h = Math.round(Math.min(H, 1500)),
        w = Math.round(W);
      if (MW !== w || MH !== h) {
        MW = w;
        MH = h;
        canvas.width = w;
        canvas.height = h;
        canvas.style.height = h + 'px';
      }
      const n = Math.round(clamp(W / 15, 26, 84));
      while (motes.length < n) {
        const m = {} as Mote;
        spawn(m, true);
        motes.push(m);
      }
      motes.length = n;
    },
    start() {
      if (!raf) raf = requestAnimationFrame(frame);
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}
