import Link from 'next/link';
import { BRAND_NAME } from '@/src/lib/brand';

// The word mark: "sanat" upright, "place" in green italics.
export function Logo() {
  return (
    <Link href="/" className="logo" aria-label={`${BRAND_NAME}, на главную`}>
      <span aria-hidden="true">
        sanat<b>place</b>
      </span>
    </Link>
  );
}
