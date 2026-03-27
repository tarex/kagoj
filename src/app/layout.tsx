import type { Metadata, Viewport } from 'next/types';
import { Literata, Noto_Sans_Bengali } from 'next/font/google';
import { PWARegister } from './pwa-register';
import './globals.css';

const literata = Literata({
  variable: '--font-literata',
  subsets: ['latin'],
  display: 'swap',
});

const notoBengali = Noto_Sans_Bengali({
  variable: '--font-bangla',
  subsets: ['bengali'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'কাগজ — Bangla Notebook',
  description:
    'Write Bangla text effortlessly with AI-powered suggestions and phonetic typing',
  openGraph: {
    title: 'কাগজ — Bangla Notebook',
    description:
      'Write Bangla effortlessly — AI suggestions & phonetic typing',
    siteName: 'কাগজ',
    locale: 'bn_BD',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'কাগজ — Bangla Notebook',
    description:
      'Write Bangla effortlessly — AI suggestions & phonetic typing',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'কাগজ',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body
        className={`${literata.variable} ${notoBengali.variable} antialiased`}
      >
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
