import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
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
    <ClerkProvider>
      <html lang="ru" className={inter.variable}>
        <body>
          <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
