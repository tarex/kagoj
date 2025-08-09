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

    // Sync scroll position
    const syncScroll = () => {
      overlay.scrollTop = textarea.scrollTop;
      overlay.scrollLeft = textarea.scrollLeft;
    };

    textarea.addEventListener('scroll', syncScroll);
    return () => textarea.removeEventListener('scroll', syncScroll);
  }, [textareaRef]);

  const handleErrorClick = (error: SpellingError, event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('Error word clicked:', error);
    setActiveError(error);
    
    // Calculate popup position
    const rect = event.currentTarget.getBoundingClientRect();
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 5,
    });
  };

  const handleCorrect = (error: SpellingError) => {
    console.log('Applying correction:', error);
    onCorrect(error);
    setActiveError(null);
  };

  const handleIgnore = (error: SpellingError) => {
    console.log('Ignoring error:', error);
    if (onIgnore) {
      onIgnore(error);
    }
    setActiveError(null);
  };

  const renderTextWithErrors = () => {
    if (errors.length === 0) return null;

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let elementCounter = 0; // Counter for unique keys

    // Sort errors by position
    const sortedErrors = [...errors].sort((a, b) => a.startIndex - b.startIndex);

    sortedErrors.forEach((error, index) => {
      // Skip invalid errors
      if (error.startIndex < 0 || error.endIndex > text.length || error.startIndex >= error.endIndex) {
        console.warn(`Skipping invalid error position: ${error.startIndex}-${error.endIndex} for word "${error.word}"`);
        return;
      }
      
      // Add transparent text before the error to maintain positioning
      if (error.startIndex > lastIndex) {
        elements.push(
          <span key={`text-before-${elementCounter++}`} style={{ color: 'transparent' }}>
            {text.substring(lastIndex, error.startIndex)}
          </span>
        );
      }

      // Get the actual text at this position
      const actualText = text.substring(error.startIndex, error.endIndex);
      
      // Add the error word with red underline styling and click handler
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
            textDecorationColor: 'red',
            textDecorationThickness: '2px',
            color: 'transparent',
            cursor: 'pointer',
            position: 'relative',
            pointerEvents: 'auto', // Only enable clicks on error words
            userSelect: 'none',
          }}
        >
          {actualText}
        </span>
      );
      lastIndex = error.endIndex;
    });

    // Add remaining transparent text
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
        className="spelling-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          padding: '48px 64px',
          pointerEvents: 'none', // Allow all events to pass through to textarea
          overflow: 'auto',
          fontSize: `${fontSize}px`,
          lineHeight: fontSize * 1.8 + 'px',
          fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          zIndex: 3,
          userSelect: 'none', // Prevent text selection on overlay
        }}
      >
        <div>
          {renderTextWithErrors()}
        </div>
      </div>

      {/* Correction Popup */}
      {activeError && (
        <div
          style={{
            position: 'fixed',
            left: popupPosition.x,
            top: popupPosition.y,
            transform: 'translateX(-50%)',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            minWidth: '200px',
            maxWidth: '300px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '8px',
            fontWeight: '500',
          }}>
            Spelling Error
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}>
            <span style={{
              fontSize: '14px',
              color: '#ef4444',
              textDecoration: 'line-through',
            }}>
              {activeError.word}
            </span>
            <span style={{ color: '#6b7280' }}>→</span>
            <span style={{
              fontSize: '14px',
              color: '#10b981',
              fontWeight: '500',
            }}>
              {activeError.correction}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleCorrect(activeError)}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
            >
              Fix
            </button>
            <button
              onClick={() => handleIgnore(activeError)}
              style={{
                padding: '8px 12px',
                background: 'transparent',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              Ignore
            </button>
          </div>
        </div>
      )}
    </>
  );
};