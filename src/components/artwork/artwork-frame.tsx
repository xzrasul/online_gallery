'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';

// The whole picture, uncropped, in a frame with a small margin. The frame takes
// the picture's own proportions: `ratio` is the best guess before the image
// loads (the painting's size in cm), then the real pixel ratio takes over. On desktop the frame sticks while the text scrolls.
export function ArtworkFrame({
  src,
  alt,
  ratio,
  children,
}: {
  src: string;
  alt: string;
  ratio: number;
  children?: ReactNode;
}) {
  const [ar, setAr] = useState(ratio);
  return (
    <div className="frame">
      <div className="art" style={{ '--ar': ar.toFixed(4) } as CSSProperties}>
        {/* eslint-disable-next-line @next/next/no-img-element -- natural size needed; remote uploads are not optimised anyway */}
        <img
          className="pic full"
          src={src}
          alt={alt}
          fetchPriority="high"
          decoding="async"
          draggable={false}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth && img.naturalHeight) setAr(img.naturalWidth / img.naturalHeight);
          }}
        />
        {children}
      </div>
    </div>
  );
}
