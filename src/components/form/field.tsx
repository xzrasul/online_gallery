import type { ReactNode } from 'react';
import { cn } from '@/src/lib/utils';

// A wrapping <label>: label text first, control second. Playwright's
// getByLabel relies on this structure.
export function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn('grid gap-1.5 text-sm font-medium', className)}>
      <span>{label}</span>
      {children}
    </label>
  );
}
