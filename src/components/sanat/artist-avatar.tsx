import Image from 'next/image';
import { cn } from '@/src/lib/utils';

const fromStorage = (url: string) => url.includes('/storage/v1/object/public/');

// The artist's round photo, or the first letter of their name on green. The
// letter stays underneath, so a photo that fails to load still leaves a face.
export function ArtistAvatar({
  name,
  url,
  size = 'md',
}: {
  name: string;
  url?: string | null;
  size?: 'md' | 'xl';
}) {
  const px = size === 'xl' ? 150 : 72;
  return (
    <span className={cn('avatar', size === 'xl' && 'avatar-xl')} aria-hidden="true">
      {name.charAt(0).toUpperCase()}
      {url &&
        (fromStorage(url) ? (
          <Image src={url} alt="" width={px} height={px} sizes={`${px}px`} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- a Telegram photo from outside our storage
          <img src={url} alt="" width={px} height={px} loading="lazy" referrerPolicy="no-referrer" />
        ))}
    </span>
  );
}
