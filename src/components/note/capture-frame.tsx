import React, { useEffect, useState } from 'react';

interface CaptureFrameProps {
  content: string;
  title: string;
  fontSize: number;
  captureRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Resolve the computed font-family from a CSS variable so html-to-image
 * can embed it correctly. CSS variables don't resolve inside SVG foreignObject
 * serialization because the variable definitions live on ancestor elements
 * outside the captured subtree.
 */
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

export function CaptureFrame({ content, title, fontSize, captureRef }: CaptureFrameProps) {
  const fontFamily = useResolvedFont('--font-bangla', "'Noto Sans Bengali', system-ui, sans-serif");

  return (
    <div
      ref={captureRef}
      className="capture-frame dark"
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: '-9999px',
        top: '0',
        width: '860px',
        padding: '32px',
        backgroundColor: '#1a1a1a',
        color: '#e8e8e8',
        fontFamily,
        fontSize: `${fontSize}px`,
        lineHeight: '1.8',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
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
