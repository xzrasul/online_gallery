import type { CSSProperties, ReactNode } from 'react';

const GOLD = '#E3B02B';
const LEAF = 'M-22 7 C-15 -11 9 -15 24 -6 C11 -7 -6 -2 -22 7Z';
const SCALE = 'M-14 9 C-14 -13 14 -13 14 9 C8 0 -8 0 -14 9Z';
const PLUME = 'M0 0 C7 -9 7 -22 0 -30 C-7 -22 -7 -9 0 0Z';
const PETAL = 'M0 0 C10 -10 10 -24 0 -32 C-10 -24 -10 -10 0 0Z';

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

// One ring group; `d` is its bloom order from the centre outwards.
function Ring({ d, children }: { d: number; children: ReactNode }) {
  return (
    <div className="bl" style={{ '--bd': d } as CSSProperties}>
      {children}
    </div>
  );
}

// One layer of the mandala: its own <svg>, just big enough for a ring of radius
// `r` (in the 400-unit mandala space) and centred. Turning a whole <svg> element
// is a GPU transform; turning groups inside one repaints every path each frame.
function Layer({ r, spin, children }: { r: number; spin?: string; children: ReactNode }) {
  return (
    <svg
      className={spin ? `ml ${spin}` : 'ml'}
      viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}
      style={{ '--s': r / 200 } as CSSProperties}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

// Suzani mandala. Rings bloom from the centre out and turn slowly in opposite
// directions. The discs and gold rules are circles, so they turn with their
// ring without any visible change.
export function SuzaniMandala() {
  return (
    <div className="mandala" aria-hidden="true">
      <Ring d={5}>
        <div className="mshadow" />
        <Layer r={200} spin="sa">
          <circle r="198" fill="#0A1B2C" />
          <circle r="190" fill="#0F2A3A" />
          <circle r="191" fill="none" stroke={GOLD} strokeWidth="1.6" />
          {range(34).map((i) => (
            <use key={i} href="#curl" x="-16" y="-188" width="32" height="32" transform={`rotate(${(i * 360) / 34})`} />
          ))}
        </Layer>
      </Ring>
      <Ring d={4}>
        <Layer r={155} spin="sb">
          <circle r="153" fill="none" stroke={GOLD} strokeWidth="1.4" />
          <circle r="150" fill="#173542" />
          {range(30).map((i) => {
            const t = `rotate(${i * 12}) translate(0,-131) rotate(-16)`;
            return (
              <g key={i}>
                <path d={LEAF} fill="#8FA3AA" transform={`${t} translate(1.6,2.4)`} />
                <path d={LEAF} fill="#F4EFE0" stroke="#C9D3D2" strokeWidth=".8" transform={t} />
              </g>
            );
          })}
        </Layer>
      </Ring>
      <Ring d={3}>
        <Layer r={113} spin="sc">
          <circle r="112" fill="#5E1230" />
          {range(22).map((i) => (
            <g key={i}>
              <path
                d={SCALE}
                fill="#C22E54"
                stroke="#F07AA0"
                strokeWidth="1.5"
                transform={`rotate(${(i * 360) / 22}) translate(0,-95)`}
              />
              <circle cx="0" cy="-106" r="1.9" fill="#F4EFE0" transform={`rotate(${(i * 360) / 22 + 180 / 22})`} />
            </g>
          ))}
        </Layer>
      </Ring>
      <Ring d={2}>
        <Layer r={81} spin="sd">
          <circle r="80" fill="#1D5A3A" />
          {range(16).map((i) => (
            <path
              key={i}
              d={PLUME}
              fill="#2E7D4F"
              stroke="#7CC48C"
              strokeWidth=".9"
              transform={`rotate(${i * 22.5}) translate(0,-46)`}
            />
          ))}
          {range(40).map((i) => (
            <circle key={i} cx="0" cy="-71" r="2" fill={GOLD} transform={`rotate(${i * 9})`} />
          ))}
        </Layer>
      </Ring>
      <Ring d={1}>
        <Layer r={47}>
          <circle r="46" fill="#0F3A2C" />
          <circle
            r="41"
            fill="none"
            stroke={GOLD}
            strokeWidth="2.6"
            strokeDasharray="0.1 5.3"
            strokeLinecap="round"
          />
        </Layer>
        <Layer r={33} spin="sa">
          {range(8).map((i) => (
            <path key={i} d={PETAL} fill="#E45A86" stroke="#F7A6C0" strokeWidth="1" transform={`rotate(${i * 45})`} />
          ))}
          {range(8).map((i) => (
            <path
              key={`b${i}`}
              d={PETAL}
              fill="#3D6FB8"
              stroke="#86AAE6"
              strokeWidth=".9"
              transform={`rotate(${i * 45 + 22.5}) scale(.62)`}
            />
          ))}
        </Layer>
      </Ring>
      <Ring d={0}>
        <Layer r={8} spin="pulse">
          <circle r="6.5" fill={GOLD} stroke="#B7264B" strokeWidth="1.6" />
        </Layer>
      </Ring>
    </div>
  );
}

// A mandala sized for its page: lg (home hero, up to 470px), md (sign-in,
// 210px) or sm (catalog, 190px). `data-center` marks it as the vortex centre.
export function Medal({ size }: { size: 'lg' | 'md' | 'sm' }) {
  return (
    <div className={`medal-${size}`} data-center="" aria-hidden="true">
      <SuzaniMandala />
    </div>
  );
}
