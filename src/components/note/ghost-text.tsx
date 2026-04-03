import React, { useEffect, useRef, useState } from 'react';

interface GhostTextProps {
  currentText: string;
  suggestion: string;
  cursorPos?: number;
  fontSize: number;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  isAISuggestion?: boolean;
  onAccept?: () => void;
}

export const GhostText = React.memo<GhostTextProps>(({
  currentText,
  suggestion,
  cursorPos,
  fontSize,
  textareaRef,
  isAISuggestion = false,
  onAccept,
}) => {
  const ghostRef = useRef<HTMLDivElement>(null);
  const [acceptPos, setAcceptPos] = useState<{ top: number; left: number } | null>(null);
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!textareaRef.current || !ghostRef.current) return;

    const textarea = textareaRef.current;
    const ghost = ghostRef.current;

    const syncScroll = () => {
      ghost.scrollTop = textarea.scrollTop;
      ghost.scrollLeft = textarea.scrollLeft;
    };

    textarea.addEventListener('scroll', syncScroll);
    return () => textarea.removeEventListener('scroll', syncScroll);
  }, [textareaRef]);

  // Calculate position for the mobile accept button based on suggestion end
  useEffect(() => {
    const updatePos = () => {
      if (!markerRef.current || !textareaRef.current) {
        setAcceptPos(null);
        return;
      }

      const marker = markerRef.current;
      const textarea = textareaRef.current;
      const editorWrapper = textarea.closest('.editor-wrapper');
      if (!editorWrapper) return;

      const markerRect = marker.getBoundingClientRect();
      const wrapperRect = editorWrapper.getBoundingClientRect();

      setAcceptPos({
        top: markerRect.top - wrapperRect.top + markerRect.height / 2,
        left: markerRect.right - wrapperRect.left + 4,
      });
    };

    updatePos();

    const textarea = textareaRef.current;
    textarea?.addEventListener('scroll', updatePos);
    window.addEventListener('resize', updatePos);

    return () => {
      textarea?.removeEventListener('scroll', updatePos);
      window.removeEventListener('resize', updatePos);
    };
  }, [suggestion, currentText, cursorPos, fontSize, textareaRef]);

  if (!suggestion) return null;

  // Split text at cursor position to insert suggestion inline
  const insertAt = cursorPos ?? currentText.length;
  const textBefore = currentText.substring(0, insertAt);
  const textAfter = currentText.substring(insertAt);

  return (
    <>
      <div
        ref={ghostRef}
        className="ghost-text-overlay"
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className="ghost-text-content">
          {textBefore}
          <span
            ref={markerRef}
            className="ghost-text-suggestion"
            data-ai={isAISuggestion ? 'true' : undefined}
          >
            {suggestion}
          </span>
          {!textAfter && (
            <span className="ghost-text-tab-hint ghost-text-hint-desktop">
              <kbd>Tab</kbd>
            </span>
          )}
          {textAfter}
        </div>
      </div>

      {/* Mobile: inline blue accept arrow positioned at end of suggestion */}
      {onAccept && acceptPos && (
        <button
          type="button"
          className="ghost-accept-btn"
          style={{
            position: 'absolute',
            top: acceptPos.top,
            left: acceptPos.left,
            transform: 'translateY(-50%)',
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            onAccept();
          }}
          aria-label="Accept suggestion"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </>
  );
});

GhostText.displayName = 'GhostText';
