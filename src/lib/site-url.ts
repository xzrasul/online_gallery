// The site's public address, for absolute links in link previews, the sitemap
// and robots.txt. Vercel sets VERCEL_PROJECT_PRODUCTION_URL (the production
// domain, also on preview deployments); NEXT_PUBLIC_SITE_URL overrides it.
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:3000';
}
