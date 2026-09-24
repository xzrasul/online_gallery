import type { Metadata } from 'next';
import { BRAND_NAME } from './brand';

// A page's link preview. Next replaces (not merges) the layout's openGraph when
// a page sets its own, so the shared fields are repeated here.
export function pagePreview({
  title,
  description,
  image,
}: {
  title: string;
  description: string;
  image?: { url: string; alt: string };
}): Pick<Metadata, 'openGraph' | 'twitter'> {
  return {
    openGraph: {
      siteName: BRAND_NAME,
      locale: 'ru_RU',
      type: 'website',
      title,
      description,
      ...(image && { images: [image] }),
    },
    twitter: { card: 'summary_large_image', title, description, ...(image && { images: [image.url] }) },
  };
}

// Plain text trimmed to fit a preview (Telegram shows ~200 characters).
export function snippet(text: string, max = 160): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}
