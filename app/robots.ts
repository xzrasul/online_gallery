import type { MetadataRoute } from 'next';
import { siteUrl } from '@/src/lib/site-url';

// Public pages are open to search engines; accounts, admin and sign-in are not.
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard', '/cabinet', '/favorites', '/choose-role', '/become-seller', '/sign-in', '/auth'],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
