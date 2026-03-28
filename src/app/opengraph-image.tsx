import { ImageResponse } from 'next/og';
import { taglineBase64 } from './og-tagline';

export const runtime = 'edge';

export const alt = 'কাগজ - সহজে বাংলা লিখুন';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const notoSansBengali = await fetch(
    new URL(
      'https://fonts.gstatic.com/s/notosansbengali/v33/Cn-SJsCGWQxOjaGwMQ6fIiMywrNJIky6nvd8BjzVMvJx2mcSPVFpVEqE-6KmsolLudA.ttf',
    ),
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: '#fafafa',
      }}
    >
      {/* Subtle warm accent strip at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #c4a882, #d4b892, #c4a882)',
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
        }}
      >
        {/* Bangla title */}
        <div
          style={{
            fontSize: 140,
            fontFamily: 'Noto Sans Bengali',
            fontWeight: 700,
            color: '#1a1a1a',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          কাগজ
        </div>

        {/* Tagline as pre-rendered image */}
        <img
          src={taglineBase64}
          width={360}
          height={60}
          style={{ opacity: 0.85 }}
        />
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: 'Noto Sans Bengali',
          data: notoSansBengali,
          style: 'normal',
          weight: 700,
        },
      ],
    },
  );
}
