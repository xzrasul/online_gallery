import type { ComponentProps } from 'react';
import { cn } from '@/src/lib/utils';

export function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-[46px] w-full rounded-full border border-input bg-white px-5 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        className,
      )}
      {...props}
    />
  );
}
