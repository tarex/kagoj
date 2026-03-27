import React, { useState, useRef, useEffect } from 'react';

interface SpellingError {
  word: string;
  correction: string;
  startIndex: number;
  endIndex: number;
}

interface SpellingOverlayProps {
  text: string;
  errors: SpellingError[];
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  fontSize: number;
  onCorrect: (error: SpellingError) => void;
  onIgnore?: (error: SpellingError) => void;
}

export const SpellingOverlay: React.FC<SpellingOverlayProps> = ({
  text,
  errors,
  textareaRef,
  fontSize,
  onCorrect,
  onIgnore,
}) => {
  const [activeError, setActiveError] = useState<SpellingError | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textareaRef.current || !overlayRef.current) return;

    const textarea = textareaRef.current;
    const overlay = overlayRef.current;

    const syncScroll = () => {
      overlay.scrollTop = textarea.scrollTop;
      overlay.scrollLeft = textarea.scrollLeft;
    };

    textarea.addEventListener('scroll', syncScroll);
    return () => textarea.removeEventListener('scroll', syncScroll);
  }, [textareaRef]);

  const handleErrorClick = (error: SpellingError, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveError(error);

    const rect = event.currentTarget.getBoundingClientRect();
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 5,
    });
  };

  const handleCorrect = (error: SpellingError) => {
    onCorrect(error);
    setActiveError(null);
  };

  const handleIgnore = (error: SpellingError) => {
    if (onIgnore) {
      onIgnore(error);
    }
    setActiveError(null);
  };

  const renderTextWithErrors = () => {
    if (errors.length === 0) return null;

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let elementCounter = 0;

    const sortedErrors = [...errors].sort((a, b) => a.startIndex - b.startIndex);

    sortedErrors.forEach((error) => {
      if (error.startIndex < 0 || error.endIndex > text.length || error.startIndex >= error.endIndex) {
        return;
      }

      if (error.startIndex > lastIndex) {
        elements.push(
          <span key={`text-before-${elementCounter++}`} style={{ color: 'transparent' }}>
            {text.substring(lastIndex, error.startIndex)}
          </span>
        );
      }

      const actualText = text.substring(error.startIndex, error.endIndex);

      elements.push(
        <span
          key={`error-${error.startIndex}-${error.endIndex}`}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleErrorClick(error, e);
          }}
          style={{
            textDecoration: 'underline',
            textDecorationStyle: 'wavy',
            textDecorationColor: 'var(--accent-danger)',
            textDecorationThickness: '2px',
            color: 'transparent',
            cursor: 'pointer',
            position: 'relative',
            pointerEvents: 'auto',
            userSelect: 'none',
          }}
        >
          {actualText}
        </span>
      );
      lastIndex = error.endIndex;
    });

    if (lastIndex < text.length) {
      elements.push(
        <span key={`text-final-${elementCounter++}`} style={{ color: 'transparent' }}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return elements;
  };

  return (
    <>
      <div
        ref={overlayRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          padding: '48px 56px',
          pointerEvents: 'none',
          overflow: 'auto',
          fontSize: `${fontSize}px`,
          lineHeight: 1.9,
          letterSpacing: '0.01em',
          fontFamily: 'var(--font-body)',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          zIndex: 3,
          userSelect: 'none',
        }}
      >
        <div>
          {renderTextWithErrors()}
        </div>
      </div>

      {/* Correction Popup — theme-aware */}
      {activeError && (
        <div
          style={{
            position: 'fixed',
            left: popupPosition.x,
            top: popupPosition.y,
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-secondary)',
            borderRadius: '12px',
            padding: '14px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            minWidth: '200px',
            maxWidth: '300px',
            animation: 'popUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginBottom: '8px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            বানান ত্রুটি
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}>
            <span style={{
              fontSize: '15px',
              color: 'var(--accent-danger)',
              textDecoration: 'line-through',
            }}>
              {activeError.word}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>→</span>
            <span style={{
              fontSize: '15px',
              color: 'var(--accent-success)',
              fontWeight: '600',
            }}>
              {activeError.correction}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleCorrect(activeError)}
              className="spelling-btn spelling-btn-primary"
              style={{ flex: 1 }}
            >
              ঠিক করুন
            </button>
            <button
              onClick={() => handleIgnore(activeError)}
              className="spelling-btn"
            >
              এড়িয়ে যান
            </button>
          </div>
        </div>
      )}
    </>
  );
};
