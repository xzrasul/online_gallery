import { cn } from '@/src/lib/utils';

// Telegram profile photo, or the user's initials when they have none.
export function UserAvatar({
  fullName,
  photoUrl,
  className,
}: {
  fullName: string;
  photoUrl: string | null;
  className?: string;
}) {
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');

  return photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- remote Telegram CDN avatar, not worth an image loader
    <img src={photoUrl} alt="" className={cn('size-8 rounded-full object-cover', className)} />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold',
        className,
      )}
    >
      {initials || '?'}
    </span>
  );
}
