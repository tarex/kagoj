import React from 'react';

interface ToolbarProps {
  onFormatBold: () => void;
  onFormatItalic: () => void;
  onFormatUnderline: () => void;
  onFormatStrikethrough: () => void;
  onFormatCode: () => void;
  onFormatHighlight: () => void;
  onInsertBullet: () => void;
  onInsertNumberedList: () => void;
  onCheckSpelling: () => void;
  isCheckingSpelling: boolean;
  isBanglaMode: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = React.memo(({
  onFormatBold,
  onFormatItalic,
  onFormatUnderline,
  onFormatStrikethrough,
  onFormatCode,
  onFormatHighlight,
  onInsertBullet,
  onInsertNumberedList,
  onCheckSpelling,
  isCheckingSpelling,
  isBanglaMode,
}) => {
  return (
    <div className="editor-toolbar">
      <div className="toolbar-formatting-group">
        {/* Text Formatting Controls */}
        <div className="flex-center gap-2">
          <button
            onClick={onFormatBold}
            className="btn-toolbar format-btn-with-text"
            title="Bold (Ctrl+B)"
          >
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>B</span>
            <span className="format-btn-label">Bold</span>
          </button>

          <button
            onClick={onFormatItalic}
            className="btn-toolbar format-btn-with-text"
            title="Italic (Ctrl+I)"
          >
            <span style={{ fontStyle: 'italic', fontSize: '16px' }}>I</span>
            <span className="format-btn-label">Italic</span>
          </button>

          <button
            onClick={onFormatUnderline}
            className="btn-toolbar format-btn-with-text"
            title="Underline (Ctrl+U)"
          >
            <span style={{ textDecoration: 'underline', fontSize: '16px' }}>U</span>
            <span className="format-btn-label">Underline</span>
          </button>

          <button
            onClick={onFormatStrikethrough}
            className="btn-toolbar format-btn-with-text"
            title="Strikethrough (Ctrl+D)"
          >
            <span style={{ textDecoration: 'line-through', fontSize: '16px' }}>S</span>
            <span className="format-btn-label">Strike</span>
          </button>

          <div className="border-l border-gray-300 dark:border-gray-600 mx-2 h-6"></div>

          <button
            onClick={onFormatCode}
            className="btn-toolbar format-btn-with-text"
            title="Code (Ctrl+E)"
          >
            <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>&lt;/&gt;</span>
            <span className="format-btn-label">Code</span>
          </button>

          <button
            onClick={onFormatHighlight}
            className="btn-toolbar format-btn-with-text"
            title="Highlight (Ctrl+H)"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
            </svg>
            <span className="format-btn-label">Highlight</span>
          </button>

          <div className="border-l border-gray-300 dark:border-gray-600 mx-2 h-6"></div>

          <button
            onClick={onInsertBullet}
            className="btn-toolbar format-btn-with-text"
            title="Bullet point"
          >
            <span style={{ fontSize: '18px' }}>•</span>
            <span className="format-btn-label">Bullet</span>
          </button>

          <button
            onClick={onInsertNumberedList}
            className="btn-toolbar format-btn-with-text"
            title="Numbered list"
          >
            <span style={{ fontSize: '14px' }}>1.</span>
            <span className="format-btn-label">Number</span>
          </button>
        </div>
        
        {/* Spell Check Button */}
        <div className="border-l border-gray-300 dark:border-gray-600 mx-2 h-6"></div>
        <button
          onClick={onCheckSpelling}
          className="btn-toolbar format-btn-with-text"
          title="Check spelling for entire document"
          disabled={isCheckingSpelling || !isBanglaMode}
          style={{
            opacity: !isBanglaMode ? 0.5 : 1,
            cursor: !isBanglaMode ? 'not-allowed' : 'pointer'
          }}
        >
          <span style={{ fontSize: '16px' }}>✓</span>
          <span className="format-btn-label">Spell Check</span>
        </button>
      </div>
    </div>
  );
});

Toolbar.displayName = 'Toolbar';