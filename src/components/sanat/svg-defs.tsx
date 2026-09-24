// Shared SVG defs, rendered once in the layout: the koshin tile (and its two
// band scales) and the gold curl used by the mandala's outer ring.
export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <pattern id="kosh" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="#0A1B2C" />
          <rect x="14.65" y="14.65" width="70.7" height="70.7" fill="#1F5A3A" stroke="#E3B02B" strokeWidth="1.6" />
          <rect
            x="14.65"
            y="14.65"
            width="70.7"
            height="70.7"
            fill="#B7264B"
            stroke="#E3B02B"
            strokeWidth="1.6"
            transform="rotate(45 50 50)"
          />
          <polygon points="50,30 70,50 50,70 30,50" fill="#F4EFE0" stroke="#E3B02B" strokeWidth="1.4" />
          <circle cx="50" cy="50" r="7" fill="#E45A86" />
          <g fill="#2E7E80" stroke="#E3B02B" strokeWidth="1.6">
            <polygon points="0,-13 13,0 0,13 -13,0" />
            <polygon points="100,-13 113,0 100,13 87,0" />
            <polygon points="0,87 13,100 0,113 -13,100" />
            <polygon points="100,87 113,100 100,113 87,100" />
          </g>
        </pattern>
        <pattern id="kosh-b" href="#kosh" patternTransform="scale(.48)" />
        <pattern id="kosh-s" href="#kosh" patternTransform="scale(.32)" />
        <symbol id="curl" viewBox="0 0 28 28">
          <path
            d="M6 24 C6 12 14 5 22 8 C28 10.5 27 19 20 18 C15 17.5 15.5 12.5 19 13"
            fill="none"
            stroke="#E3B02B"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </symbol>
      </defs>
    </svg>
  );
}
