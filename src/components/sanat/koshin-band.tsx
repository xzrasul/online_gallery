import { cn } from '@/src/lib/utils';

// A ribbon of koshin diamonds between gold rules. The tile marches sideways;
// `small` is the 34px band used inside the sign-in panel.
export function KoshinBand({ small = false, className }: { small?: boolean; className?: string }) {
  return (
    <div className={cn('dband', small && 's', className)} aria-hidden="true">
      <svg>
        <rect className="march" x={small ? -64 : -96} width="5000" height="100%" fill={`url(#${small ? 'kosh-s' : 'kosh-b'})`} />
      </svg>
    </div>
  );
}
