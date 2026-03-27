import { ImageResponse } from 'next/og';

export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          borderRadius: 32,
        }}
      >
        <span
          style={{
            fontSize: 120,
            color: '#f5f0e8',
            fontFamily: 'sans-serif',
          }}
        >
          ক
        </span>
      </div>
    ),
    { ...size },
  );
}
