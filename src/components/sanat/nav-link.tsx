'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

// Header link with a gold underline that grows from the left; it stays
// underlined anywhere inside its section (`match` is a path prefix).
export function NavLink({ href, match, children }: { href: string; match?: string; children: ReactNode }) {
  const pathname = usePathname();
  const prefix = match ?? href;
  const current = pathname === prefix || pathname.startsWith(prefix + '/');
  return (
    <Link href={href} className="link" aria-current={current ? 'page' : undefined}>
      {children}
    </Link>
  );
}
