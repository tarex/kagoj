import React, { useEffect, useState } from 'react';

export type AspectRatio = 'auto' | '1:1' | '4:5' | '16:9';

export const ASPECT_RATIOS: { key: AspectRatio; label: string; width: number; minHeight?: number }[] = [
  { key: 'auto', label: 'Auto', width: 860 },
  { key: '1:1', label: '1:1', width: 860, minHeight: 860 },
  { key: '4:5', label: '4:5', width: 860, minHeight: 1075 },
  { key: '16:9', label: '16:9', width: 860, minHeight: 484 },
];

interface CaptureFrameProps {
  content: string;
  title: string;
  fontSize: number;
  aspectRatio: AspectRatio;
  captureRef: React.RefObject<HTMLDivElement | null>;
}

function useResolvedFont(cssVar: string, fallback: string): string {
  const [resolved, setResolved] = useState(fallback);

  useEffect(() => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
    if (value) {
      setResolved(`${value}, ${fallback}`);
    }
  }, [cssVar, fallback]);

  return resolved;
}

export function CaptureFrame({ content, title, fontSize, aspectRatio, captureRef }: CaptureFrameProps) {
  const fontFamily = useResolvedFont('--font-bangla', "'Noto Sans Bengali', system-ui, sans-serif");
  const ratio = ASPECT_RATIOS.find((r) => r.key === aspectRatio) ?? ASPECT_RATIOS[0];

  return (
    <div
      ref={captureRef}
      className="capture-frame dark"
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: '-9999px',
        top: '0',
        width: `${ratio.width}px`,
        minHeight: ratio.minHeight ? `${ratio.minHeight}px` : undefined,
        padding: '32px',
        backgroundColor: '#1a1a1a',
        color: '#e8e8e8',
        fontFamily,
        fontSize: `${fontSize}px`,
        lineHeight: '1.8',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: ratio.minHeight ? 'center' : 'flex-start',
      }}
    >
      {title && (
        <div
          style={{
            fontWeight: '600',
            fontSize: '1.25em',
            marginBottom: '16px',
            color: '#e8e8e8',
          }}
        >
          {title}
        </div>
      )}
      <div>{content}</div>
    </div>
  );
}
