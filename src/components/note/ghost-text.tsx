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

    // Sync scroll position
    const syncScroll = () => {
      ghost.scrollTop = textarea.scrollTop;
      ghost.scrollLeft = textarea.scrollLeft;
    };

    textarea.addEventListener('scroll', syncScroll);
    return () => textarea.removeEventListener('scroll', syncScroll);
  }, [textareaRef]);

  console.log('GhostText rendering with suggestion:', suggestion, 'isAI:', isAISuggestion);

  if (!suggestion) return null;

  return (
    <>
      {/* AI Indicator Badge */}
      {isAISuggestion && (
        <div style={{
          position: 'absolute',
          top: '-25px',
          right: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '600',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)',
          animation: 'slideDown 0.3s ease-out',
        }}>
          <span style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'white',
            animation: 'pulse 2s infinite',
          }}></span>
          AI Suggestion
        </div>
      )}
      
      <div
        ref={ghostRef}
        className="ghost-text-overlay"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: fontSize * 1.8 + 'px',
        }}
      >
        <div className="ghost-text-content">
          {currentText}
          <span 
            className={isAISuggestion ? "ghost-text-ai-suggestion" : "ghost-text-suggestion"}
            style={isAISuggestion ? {
              background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
              borderRadius: '3px',
              padding: '0 2px',
            } : {}}
          >
            {suggestion}
          </span>
        </div>
      </div>
    </>
  );
});

GhostText.displayName = 'GhostText';