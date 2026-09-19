import Image from 'next/image';
import { cn } from '@/src/lib/utils';

export function ArtworkImage({
  src,
  alt,
  sizes,
  priority,
  className,
}: {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('relative aspect-[4/5] overflow-hidden rounded-sm bg-secondary', className)}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized className="object-cover" />
    </div>
  );
}
