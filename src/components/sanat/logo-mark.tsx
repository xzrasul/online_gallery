import { VORTEX_ARMS, VORTEX_COLOURS } from '@/src/lib/sanat/vortex-logo';

// The still vortex next to the wordmark (no animation).
export function LogoMark() {
  return (
    <svg viewBox="-20 -20 40 40" aria-hidden="true" focusable="false">
      <circle r="18" fill="#0F2A3A" stroke="#E3B02B" strokeWidth="2" />
      {VORTEX_ARMS.map((d, i) => (
        <path key={i} d={d} fill={VORTEX_COLOURS[i]} />
      ))}
      <circle r="2.4" fill="#E3B02B" />
    </svg>
  );
}
