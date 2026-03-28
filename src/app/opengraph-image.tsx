import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'কাগজ — সহজে বাংলা লিখুন';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const notoSansBengali = await fetch(
    'https://fonts.gstatic.com/s/notosansbengali/v20/Cn-SJsCGWQxOjaGwMQ6fIiMywrNJIky6nvd8BjzVMvJx2mcSPVFpVEqE-6KmsolKl1st.woff2'
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
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
          background: 'linear-gradient(145deg, #faf8f5 0%, #f0ece6 40%, #e8e2d8 100%)',
        }}
      >
        {/* Subtle paper texture */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.04,
            background:
              'repeating-linear-gradient(0deg, #000 0px, transparent 1px, transparent 28px)',
          }}
        />

        {/* Top decorative line */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 80,
            right: 80,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #c4a882, transparent)',
          }}
        />

        {/* Bottom decorative line */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 80,
            right: 80,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #c4a882, transparent)',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Bangla title */}
          <div
            style={{
              fontSize: 120,
              fontFamily: 'Noto Sans Bengali',
              fontWeight: 700,
              color: '#1a1a1a',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            কাগজ
          </div>

          {/* Thin divider */}
          <div
            style={{
              width: 80,
              height: 1,
              background: '#c4a882',
              marginTop: 4,
              marginBottom: 4,
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontSize: 28,
              fontFamily: 'Noto Sans Bengali',
              fontWeight: 400,
              color: '#6b5c4c',
              letterSpacing: '0.04em',
            }}
          >
            সহজে বাংলা লিখুন
          </div>
        </div>

        {/* Corner accents */}
        <div style={{ position: 'absolute', top: 32, left: 72, width: 24, height: 24, borderTop: '2px solid #c4a882', borderLeft: '2px solid #c4a882' }} />
        <div style={{ position: 'absolute', top: 32, right: 72, width: 24, height: 24, borderTop: '2px solid #c4a882', borderRight: '2px solid #c4a882' }} />
        <div style={{ position: 'absolute', bottom: 32, left: 72, width: 24, height: 24, borderBottom: '2px solid #c4a882', borderLeft: '2px solid #c4a882' }} />
        <div style={{ position: 'absolute', bottom: 32, right: 72, width: 24, height: 24, borderBottom: '2px solid #c4a882', borderRight: '2px solid #c4a882' }} />
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Noto Sans Bengali',
          data: notoSansBengali,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'Noto Sans Bengali',
          data: notoSansBengali,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  );
}
