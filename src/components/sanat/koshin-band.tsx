import { cn } from '@/src/lib/utils';

// A ribbon of koshin diamonds between gold rules. The whole <svg> marches
// sideways by one tile (a GPU transform; moving a shape inside the SVG would
// repaint the band every frame). `small` is the 34px band inside the sign-in panel.
export function KoshinBand({ small = false, className }: { small?: boolean; className?: string }) {
  return (
    <div className={cn('dband', small && 's', className)} aria-hidden="true">
      <svg className="march" focusable="false">
        <rect width="100%" height="100%" fill={`url(#${small ? 'kosh-s' : 'kosh-b'})`} />
      </svg>
    </div>
  );
}
