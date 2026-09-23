import { cn } from '@/src/lib/utils';

// "Sanat" in the text colour, "Place" in the brand accent; reads as one word.
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-semibold tracking-tight', className)}>
      Sanat<span className="text-brand">Place</span>
    </span>
  );
}
