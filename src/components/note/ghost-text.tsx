import React, { useEffect, useRef } from 'react';

interface GhostTextProps {
  currentText: string;
  suggestion: string;
  fontSize: number;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  isAISuggestion?: boolean;
}

export const GhostText = React.memo<GhostTextProps>(({
  currentText,
  suggestion,
  fontSize,
  textareaRef,
  isAISuggestion = false,
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

  return (
    <div
      ref={ghostRef}
      className="ghost-text-overlay"
      style={{ fontSize: `${fontSize}px` }}
    >
      <div className="ghost-text-content">
        {currentText}
        <span className="ghost-text-suggestion" data-ai={isAISuggestion ? 'true' : undefined}>
          {suggestion}
        </span>
        <span className="ghost-text-tab-hint">
          <kbd>Tab</kbd>
        </span>
      </div>
    </div>
  );
});

GhostText.displayName = 'GhostText';
