// The sanatplace mark: a still vortex of three brush strokes (gold, pale teal,
// rose) turning into a gold centre, inside a dark disc with a gold rim.
// viewBox "-20 -20 40 40". Also the source of app/icon.svg (the favicon).

export const VORTEX_COLOURS = ['#E3B02B', '#8CC7D0', '#E45A86'] as const;

// Each arm is a filled stroke: broad at the rim, thin at the centre, a little
// over one turn, the three arms 120° apart.
function arm(k: number): string {
  const N = 30;
  const off = (k * 2 * Math.PI) / 3 - Math.PI / 2;
  const at = (t: number) => {
    const r = 14.4 - 12.2 * Math.pow(t, 0.8);
    const a = off + t * 1.05 * 2 * Math.PI;
    return [Math.cos(a) * r, Math.sin(a) * r] as const;
  };
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const [x, y] = at(t);
    const [x2, y2] = at(Math.min(1, t + 0.01));
    const [x0, y0] = at(Math.max(0, t - 0.01));
    const len = Math.hypot(x2 - x0, y2 - y0) || 1;
    const nx = -(y2 - y0) / len,
      ny = (x2 - x0) / len;
    const w = (3.6 * Math.pow(1 - t, 0.9) + 0.35) / 2;
    left.push(`${(x + nx * w).toFixed(2)} ${(y + ny * w).toFixed(2)}`);
    right.unshift(`${(x - nx * w).toFixed(2)} ${(y - ny * w).toFixed(2)}`);
  }
  return `M${[...left, ...right].join('L')}Z`;
}

export const VORTEX_ARMS = [arm(0), arm(1), arm(2)];

// The mark as a standalone SVG document (for the favicon).
export function vortexSvg(): string {
  const arms = VORTEX_ARMS.map((d, i) => `  <path d="${d}" fill="${VORTEX_COLOURS[i]}"/>`).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -20 40 40">
  <circle r="18" fill="#0F2A3A" stroke="#E3B02B" stroke-width="2"/>
${arms}
  <circle r="2.4" fill="#E3B02B"/>
</svg>
`;
}
