import React, { useEffect, useRef } from 'react';

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
            className="ghost-text-suggestion"
            data-ai={isAISuggestion ? 'true' : undefined}
          >
            {suggestion}
          </span>
          <span className="ghost-text-tab-hint ghost-text-hint-desktop">
            <kbd>Tab</kbd>
          </span>
          {textAfter}
        </div>
      </div>

      {/* Mobile: floating accept bar above the textarea z-index */}
      {onAccept && (
        <button
          type="button"
          className="ghost-accept-bar"
          onPointerDown={(e) => {
            // Use pointerDown + preventDefault to avoid blurring the textarea
            e.preventDefault();
            onAccept();
          }}
        >
          <span className="ghost-accept-text">
            {isAISuggestion ? 'AI: ' : ''}{suggestion}
          </span>
          <kbd>tap</kbd>
        </button>
      )}
    </>
  );
});

GhostText.displayName = 'GhostText';
