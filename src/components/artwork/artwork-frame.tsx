'use client';

import Image from 'next/image';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { isStorageUrl } from '@/src/lib/uploads/buckets';

// The whole picture, uncropped, in a white frame on a pale tile. The frame
// takes the picture's proportions: `ratio` is the best guess before the image
// loads (the stored pixel size, else the painting's size in cm), then the real
// one takes over. On desktop the frame sticks while the text scrolls.
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
        <Image
          className="pic full"
          src={src}
          alt={alt}
          width={1400}
          height={Math.round(1400 / ratio)}
          sizes="(min-width: 1240px) 520px, (min-width: 860px) 42vw, 90vw"
          priority
          unoptimized={!isStorageUrl(src)}
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
