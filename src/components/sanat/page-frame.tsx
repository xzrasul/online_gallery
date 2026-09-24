'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { KoshinBand } from '@/src/components/sanat/koshin-band';
import { pageNameOf } from '@/src/components/sanat/stage';

// The redesigned public pages lay themselves out edge to edge (hero, bands).
// Every other page (cabinets, admin, artist profile) gets a band under the
// header and the standard content column.
export function PageFrame({ children }: { children: ReactNode }) {
  const page = pageNameOf(usePathname());
  if (page !== 'other') return <div className="page">{children}</div>;
  return (
    <div className="page">
      <KoshinBand />
      <div className="wrap page-plain">{children}</div>
    </div>
  );
}
