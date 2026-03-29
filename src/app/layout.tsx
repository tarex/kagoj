import type { Metadata, Viewport } from 'next/types';
import { Literata, Noto_Sans_Bengali } from 'next/font/google';
import { PWARegister } from './pwa-register';
import { ConsoleGreeting } from './console-greeting';
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
  metadataBase: process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
    : new URL('http://localhost:3000'),
  manifest: '/manifest.json',
  title: 'কাগজ - সহজে বাংলা লিখুন',
  description: 'Type English keys, see Bangla instantly. Phonetic Bangla writing app with per-keystroke transliteration, adaptive dictionary, and ghost text suggestions. Works offline.',
  openGraph: {
    title: 'কাগজ - সহজে বাংলা লিখুন',
    description: 'Type English keys, see Bangla instantly. Phonetic Bangla writing app with per-keystroke transliteration, adaptive dictionary, and ghost text suggestions.',
    siteName: 'কাগজ',
    locale: 'bn_BD',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'কাগজ - সহজে বাংলা লিখুন',
    description: 'Type English keys, see Bangla instantly. Phonetic Bangla writing with per-keystroke transliteration. Works offline.',
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
    <html lang="bn" suppressHydrationWarning>
      <body
        className={`${literata.variable} ${notoBengali.variable} antialiased`}
      >
        <PWARegister />
        <ConsoleGreeting />
        {children}
      </body>
    </html>
  );
}
