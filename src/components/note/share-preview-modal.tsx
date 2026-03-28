import React, { useEffect, useState, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { CaptureFrame, ASPECT_RATIOS, type AspectRatio } from './capture-frame';
import type { CopyStatus } from '../../hooks/useShareImage';

interface SharePreviewModalProps {
  isOpen: boolean;
  content: string;
  title: string;
  fontSize: number;
  captureRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onDownload: () => void;
  onCopy: () => void;
  isCapturing: boolean;
  copyStatus: CopyStatus;
}

export function SharePreviewModal({
  isOpen,
  content,
  title,
  fontSize,
  captureRef,
  onClose,
  onDownload,
  onCopy,
  isCapturing,
  copyStatus,
}: SharePreviewModalProps) {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('auto');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const generatePreview = useCallback(async () => {
    if (!captureRef.current) return;
    setGenerating(true);
    try {
      await document.fonts.ready;
      await new Promise<void>((r) => setTimeout(r, 200));

      const url = await toPng(captureRef.current, {
        pixelRatio: 1,
        cacheBust: true,
        backgroundColor: '#1a1a1a',
        style: { position: 'static', left: 'auto' },
      });
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(null);
    } finally {
      setGenerating(false);
    }
  }, [captureRef]);

  // Regenerate preview when aspect ratio or content changes
  useEffect(() => {
    if (!isOpen) return;
    // Wait for CaptureFrame to re-render with new aspect ratio
    const timer = setTimeout(() => {
      generatePreview();
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen, aspectRatio, content, title, generatePreview]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const statusLabel =
    copyStatus === 'copied' ? 'Copied!' :
    copyStatus === 'downloaded' ? 'Saved!' :
    copyStatus === 'fallback' ? 'Downloaded' :
    null;

  return (
    <>
      {/* CaptureFrame stays off-screen but receives aspectRatio */}
      <CaptureFrame
        content={content}
        title={title}
        fontSize={fontSize}
        aspectRatio={aspectRatio}
        captureRef={captureRef}
      />

      {/* Modal backdrop */}
      <div
        className="share-modal-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        {/* Modal content */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#242424',
            borderRadius: '12px',
            maxWidth: '640px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #333',
          }}>
            <span style={{ color: '#e8e8e8', fontSize: '15px', fontWeight: 500 }}>Share as Image</span>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                padding: '4px',
                lineHeight: 0,
              }}
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Preview area */}
          <div style={{
            padding: '20px',
            overflow: 'auto',
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}>
            {generating || !previewUrl ? (
              <div style={{
                color: '#666',
                fontSize: '13px',
                padding: '60px 0',
              }}>
                Generating preview...
              </div>
            ) : (
              <img
                src={previewUrl}
                alt="Capture preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '50vh',
                  borderRadius: '6px',
                  border: '1px solid #333',
                }}
              />
            )}
          </div>

          {/* Aspect ratio picker */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 20px 16px',
            justifyContent: 'center',
          }}>
            {ASPECT_RATIOS.map((r) => (
              <button
                key={r.key}
                onClick={() => setAspectRatio(r.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: aspectRatio === r.key ? '1px solid #4ade80' : '1px solid #444',
                  background: aspectRatio === r.key ? 'rgba(74, 222, 128, 0.1)' : 'transparent',
                  color: aspectRatio === r.key ? '#4ade80' : '#999',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px 16px',
            borderTop: '1px solid #333',
            justifyContent: 'flex-end',
          }}>
            {statusLabel && (
              <span style={{
                color: copyStatus === 'fallback' ? '#fbbf24' : '#4ade80',
                fontSize: '12px',
                marginRight: 'auto',
              }}>
                {statusLabel}
              </span>
            )}
            <button
              onClick={onCopy}
              disabled={isCapturing || generating}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: '1px solid #444',
                background: 'transparent',
                color: '#e8e8e8',
                fontSize: '13px',
                cursor: isCapturing ? 'not-allowed' : 'pointer',
                opacity: isCapturing ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
              Copy
            </button>
            <button
              onClick={onDownload}
              disabled={isCapturing || generating}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: '#e8e8e8',
                color: '#1a1a1a',
                fontSize: '13px',
                fontWeight: 500,
                cursor: isCapturing ? 'not-allowed' : 'pointer',
                opacity: isCapturing ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
