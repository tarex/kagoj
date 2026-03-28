import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'কাগজ - সহজে বাংলা লিখুন',
    short_name: 'কাগজ',
    description: 'সহজে বাংলা লিখুন - AI suggestions & phonetic typing',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    orientation: 'any',
    categories: ['productivity', 'utilities', 'education'],
    lang: 'bn',
    dir: 'auto',
    icons: [
      {
        src: '/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'নতুন নোট',
        short_name: 'নতুন',
        description: 'নতুন নোট তৈরি করুন',
        url: '/?action=new',
      },
    ],
  };
}
