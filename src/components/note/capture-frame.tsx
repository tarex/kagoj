import React from 'react';

interface CaptureFrameProps {
  content: string;
  title: string;
  captureRef: React.RefObject<HTMLDivElement | null>;
}

export function CaptureFrame({ content, title, captureRef }: CaptureFrameProps) {
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
        fontFamily: "var(--font-bangla), 'Noto Sans Bengali', system-ui, sans-serif",
        fontSize: 'inherit',
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
