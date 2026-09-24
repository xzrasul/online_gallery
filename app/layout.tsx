import { Kelly_Slab, Kufam, Roboto_Slab } from 'next/font/google';
import type { CSSProperties, ReactNode } from 'react';
import { SiteFooter } from '@/src/components/site-footer';
import { SiteHeader } from '@/src/components/site-header';
import { PageFrame } from '@/src/components/sanat/page-frame';
import { Stage } from '@/src/components/sanat/stage';
import { SvgDefs } from '@/src/components/sanat/svg-defs';
import { BRAND_NAME, BRAND_TAGLINE } from '@/src/lib/brand';
import './globals.css';

// Kelly Slab everywhere. It has no Tajik letters (ғ ӣ қ ӯ ҳ ҷ), so the browser
// takes just those glyphs from Roboto Slab.
const kelly = Kelly_Slab({
  weight: '400',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-kelly',
  display: 'swap',
});
const robotoSlab = Roboto_Slab({
  weight: '400',
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-roboto-slab',
  display: 'swap',
});
// Only for the Arabic-script «صنعت» on the home page.
const kufam = Kufam({
  weight: '700',
  subsets: ['arabic'],
  variable: '--font-kufam',
  display: 'swap',
});

// next/font's family lists end with a metric-adjusted local(Arial) face, which
// would catch the Tajik letters before Roboto Slab. Chain the primary families only.
const primary = (font: { style: { fontFamily: string } }) => font.style.fontFamily.split(',')[0];
const fontBody = `${primary(kelly)}, ${primary(robotoSlab)}, Georgia, serif`;

export const metadata = {
  title: { default: `${BRAND_NAME} — место для искусства`, template: `%s — ${BRAND_NAME}` },
  description: BRAND_TAGLINE,
  applicationName: BRAND_NAME,
};

export const viewport = {
  themeColor: '#08141F',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ru"
      className={`${kelly.variable} ${robotoSlab.variable} ${kufam.variable}`}
      style={{ '--font-body': fontBody } as CSSProperties}
    >
      <body>
        <SvgDefs />
        <Stage>
          <SiteHeader />
          <PageFrame>{children}</PageFrame>
          <SiteFooter />
        </Stage>
      </body>
    </html>
  );
}
