import Image from 'next/image';

// The painted suzani medallion next to the wordmark (transparent background).
// 136px source for a 40px mark: sharp on high-density screens, ~12 KB.
export function LogoMark() {
  return (
    <Image
      className="logo-mark"
      src="/brand/mandala-logo-136.webp"
      alt=""
      width={40}
      height={40}
      priority
      unoptimized
    />
  );
}
