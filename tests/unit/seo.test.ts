import { describe, it, expect, afterEach } from 'vitest';
import { pagePreview, snippet } from '../../src/lib/seo';
import { siteUrl } from '../../src/lib/site-url';

describe('snippet', () => {
  it('flattens whitespace and keeps short text as is', () => {
    expect(snippet('Пишу  маслом\nгоры Памира.')).toBe('Пишу маслом горы Памира.');
  });

  it('cuts long text with an ellipsis within the limit', () => {
    const out = snippet('слово '.repeat(60), 50);
    expect(out.length).toBeLessThanOrEqual(50);
    expect(out.endsWith('…')).toBe(true);
  });
});

describe('pagePreview', () => {
  it('keeps the shared fields next to the page image', () => {
    const p = pagePreview({ title: 'T', description: 'D', image: { url: 'https://x/y.webp', alt: 'A' } });
    expect(p.openGraph).toMatchObject({ siteName: 'sanatplace', locale: 'ru_RU', title: 'T', images: [{ url: 'https://x/y.webp', alt: 'A' }] });
    expect(p.twitter).toMatchObject({ card: 'summary_large_image', images: ['https://x/y.webp'] });
  });

  it('leaves the image out when there is none (the brand card is used)', () => {
    expect(pagePreview({ title: 'T', description: 'D' }).openGraph).not.toHaveProperty('images');
  });
});

describe('siteUrl', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('prefers NEXT_PUBLIC_SITE_URL, then the Vercel production domain, then localhost', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    expect(siteUrl()).toBe('http://localhost:3000');
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'sanatplace.vercel.app';
    expect(siteUrl()).toBe('https://sanatplace.vercel.app');
    process.env.NEXT_PUBLIC_SITE_URL = 'https://sanatplace.tj/';
    expect(siteUrl()).toBe('https://sanatplace.tj');
  });
});
