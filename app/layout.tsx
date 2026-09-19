import { ClerkProvider } from '@clerk/nextjs';
import { ruRU } from '@clerk/localizations';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/src/components/site-footer';
import { SiteHeader } from '@/src/components/site-header';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'Галерея художников',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      localization={ruRU}
      appearance={{
        variables: {
          colorPrimary: '#2b2622',
          colorBackground: '#fffdf9',
          borderRadius: '0.5rem',
          fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif',
        },
      }}
    >
      <html lang="ru" className={inter.variable}>
        <body className="flex min-h-screen flex-col">
          <SiteHeader />
          <div className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</div>
          <SiteFooter />
        </body>
      </html>
    </ClerkProvider>
  );
}
