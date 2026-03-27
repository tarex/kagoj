import type { Metadata } from 'next/types';
import { Literata, Noto_Sans_Bengali } from 'next/font/google';
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
        {children}
      </body>
    </html>
  );
}
