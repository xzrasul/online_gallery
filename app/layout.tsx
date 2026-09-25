import { Kufam, Oswald } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { siteUrl } from '@/src/lib/site-url';
import { SiteFooter } from '@/src/components/site-footer';
import { SiteHeader } from '@/src/components/site-header';
import { Backdrop } from '@/src/components/sanat/backdrop';
import { LoadingScreen } from '@/src/components/sanat/loading-screen';
import { LOADING_BOOT_SCRIPT } from '@/src/lib/sanat/loading';
import { PageFrame } from '@/src/components/sanat/page-frame';
import { SvgDefs } from '@/src/components/sanat/svg-defs';
import { BRAND_NAME, BRAND_TAGLINE } from '@/src/lib/brand';
import './globals.css';

// Oswald everywhere: 500 for text, 600 for headings. Its cyrillic-ext subset
// carries the Tajik letters (Ғ Ӣ Қ Ӯ Ҳ Ҷ).
const oswald = Oswald({
  weight: ['500', '600'],
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-oswald',
  display: 'swap',
});
// Only for the Arabic-script «صنعت».
const kufam = Kufam({
  weight: '700',
  subsets: ['arabic'],
  variable: '--font-kufam',
  display: 'swap',
});

// Link previews (Telegram, WhatsApp, social networks): every page gets the
// brand card from app/opengraph-image.png unless it sets its own image.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${BRAND_NAME} — место для искусства`, template: `%s — ${BRAND_NAME}` },
  description: BRAND_TAGLINE,
  applicationName: BRAND_NAME,
  openGraph: {
    siteName: BRAND_NAME,
    locale: 'ru_RU',
    type: 'website',
    title: `${BRAND_NAME} — место для искусства`,
    description: BRAND_TAGLINE,
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport = {
  themeColor: '#08141F',
  colorScheme: 'dark',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // the boot script sets data-load on <html> before hydration
    <html lang="ru" className={`${oswald.variable} ${kufam.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOADING_BOOT_SCRIPT }} />
        <noscript>
          <style>{'.loader{display:none}'}</style>
        </noscript>
      </head>
      <body>
        <SvgDefs />
        <LoadingScreen />
        <Backdrop />
        <div className="stage">
          <SiteHeader />
          <PageFrame>{children}</PageFrame>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
