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

  useEffect(() => {
    if (!isOpen) return;
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

  // Lock body scroll on mobile when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [isOpen]);

  if (!isOpen) return null;

  const statusLabel =
    copyStatus === 'copied' ? 'Copied!' :
    copyStatus === 'downloaded' ? 'Saved!' :
    copyStatus === 'fallback' ? 'Downloaded' :
    null;

  const busy = isCapturing || generating;

  return (
    <>
      <CaptureFrame
        content={content}
        title={title}
        fontSize={fontSize}
        aspectRatio={aspectRatio}
        captureRef={captureRef}
      />

      {/* Backdrop */}
      <div
        className="share-modal-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        {/* Modal -- bottom sheet on mobile, centered card on desktop */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="share-modal"
          style={{
            backgroundColor: '#242424',
            width: '100%',
            maxWidth: '640px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            /* Safe area for PWA / notch devices */
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {/* Drag handle (mobile affordance) */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '8px 0 0',
          }}>
            <div style={{
              width: '36px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: '#555',
            }} />
          </div>

          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px 12px',
          }}>
            <span style={{ color: '#e8e8e8', fontSize: '15px', fontWeight: 500 }}>Share as Image</span>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                padding: '8px',
                margin: '-8px',
                lineHeight: 0,
                /* Larger touch target */
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Preview area */}
          <div style={{
            padding: '8px 16px 12px',
            overflow: 'auto',
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '120px',
            WebkitOverflowScrolling: 'touch',
          }}>
            {generating || !previewUrl ? (
              <div style={{
                color: '#666',
                fontSize: '13px',
                padding: '40px 0',
              }}>
                Generating preview...
              </div>
            ) : (
              <img
                src={previewUrl}
                alt="Capture preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '40vh',
                  borderRadius: '8px',
                  border: '1px solid #333',
                }}
              />
            )}
          </div>

          {/* Aspect ratio picker -- scrollable row on mobile */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 16px 12px',
            justifyContent: 'center',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            flexShrink: 0,
          }}>
            {ASPECT_RATIOS.map((r) => (
              <button
                key={r.key}
                onClick={() => setAspectRatio(r.key)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: aspectRatio === r.key ? '1px solid #4ade80' : '1px solid #444',
                  background: aspectRatio === r.key ? 'rgba(74, 222, 128, 0.1)' : 'transparent',
                  color: aspectRatio === r.key ? '#4ade80' : '#999',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  flexShrink: 0,
                  /* Touch-friendly size */
                  minHeight: '40px',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Actions -- full-width stacked on very small screens */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px 16px',
            borderTop: '1px solid #333',
            flexShrink: 0,
          }}>
            {statusLabel && (
              <span style={{
                color: copyStatus === 'fallback' ? '#fbbf24' : '#4ade80',
                fontSize: '12px',
                position: 'absolute',
                top: '-24px',
              }}>
                {statusLabel}
              </span>
            )}
            <button
              onClick={onCopy}
              disabled={busy}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid #444',
                background: 'transparent',
                color: '#e8e8e8',
                fontSize: '14px',
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '48px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
              {copyStatus === 'copied' ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={onDownload}
              disabled={busy}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '10px',
                border: 'none',
                background: '#e8e8e8',
                color: '#1a1a1a',
                fontSize: '14px',
                fontWeight: 500,
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '48px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {copyStatus === 'downloaded' ? 'Saved!' : 'Download'}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop override: center the modal instead of bottom-sheet */}
      <style>{`
        @media (min-width: 640px) {
          .share-modal-backdrop {
            align-items: center !important;
            padding: 24px !important;
          }
          .share-modal {
            border-radius: 12px !important;
            max-height: 85vh !important;
          }
        }
      `}</style>
    </>
  );
}
