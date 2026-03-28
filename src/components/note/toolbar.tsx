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
  onPrint: () => void;
  onShareImage: () => void;
  onCopyToClipboard: () => void;
  isBanglaMode: boolean;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
}

const ToolbarSep = () => <div className="toolbar-sep" />;

const ToolbarBtn: React.FC<{
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, title, disabled, children }) => (
  <button
    onClick={onClick}
    className="toolbar-btn"
    data-tooltip={title}
    aria-label={title}
    disabled={disabled}
  >
    {children}
  </button>
);

export const Toolbar: React.FC<ToolbarProps> = React.memo(({
  onFormatBold,
  onFormatItalic,
  onFormatUnderline,
  onFormatStrikethrough,
  onFormatCode,
  onFormatHighlight,
  onInsertBullet,
  onInsertNumberedList,
  onPrint,
  onShareImage,
  onCopyToClipboard,
  isBanglaMode,
  fontSize,
  onFontSizeChange,
}) => {
  return (
    <div className="editor-toolbar">
      {/* Text style */}
      <ToolbarBtn onClick={onFormatBold} title="Bold (Ctrl+B)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 4h8a4 4 0 0 1 2.69 6.97A4 4 0 0 1 15 20H6V4zm2 8h6a2 2 0 1 0 0-4H8v4zm0 2v4h7a2 2 0 1 0 0-4H8z"/>
        </svg>
      </ToolbarBtn>
      <ToolbarBtn onClick={onFormatItalic} title="Italic (Ctrl+I)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15 4H9v2h2.23l-3.46 12H5v2h6v-2H8.77l3.46-12H15V4z"/>
        </svg>
      </ToolbarBtn>
      <ToolbarBtn onClick={onFormatUnderline} title="Underline (Ctrl+U)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
        </svg>
      </ToolbarBtn>
      <ToolbarBtn onClick={onFormatStrikethrough} title="Strikethrough (Ctrl+D)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 12h18v2H3v-2zm4.5-2c0-.28.22-.5.5-.5h8c.28 0 .5.22.5.5H18c0-1.38-1.12-2.5-2.5-2.5h-2V5h-3v2.5h-2C7.12 7.5 6 8.62 6 10h1.5zm9 4c0 .28-.22.5-.5.5H8c-.28 0-.5-.22-.5-.5H6c0 1.38 1.12 2.5 2.5 2.5h2V19h3v-2.5h2c1.38 0 2.5-1.12 2.5-2.5h-1.5z"/>
        </svg>
      </ToolbarBtn>

      <ToolbarSep />

      {/* Semantic */}
      <ToolbarBtn onClick={onFormatCode} title="Code (Ctrl+E)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      </ToolbarBtn>
      <ToolbarBtn onClick={onFormatHighlight} title="Highlight (Ctrl+H)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 11-6 6v3h9l3-3" />
          <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
        </svg>
      </ToolbarBtn>

      <ToolbarSep />

      {/* Lists */}
      <ToolbarBtn onClick={onInsertBullet} title="Bullet list">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="4" cy="6" r="1.5" />
          <circle cx="4" cy="12" r="1.5" />
          <circle cx="4" cy="18" r="1.5" />
          <rect x="8" y="5" width="13" height="2" rx="1" />
          <rect x="8" y="11" width="13" height="2" rx="1" />
          <rect x="8" y="17" width="13" height="2" rx="1" />
        </svg>
      </ToolbarBtn>
      <ToolbarBtn onClick={onInsertNumberedList} title="সংখ্যা তালিকা">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <text x="1" y="8" fontSize="7" fontWeight="600" fontFamily="system-ui">১</text>
          <text x="1" y="14.5" fontSize="7" fontWeight="600" fontFamily="system-ui">২</text>
          <text x="1" y="21" fontSize="7" fontWeight="600" fontFamily="system-ui">৩</text>
          <rect x="9" y="5" width="12" height="2" rx="1" />
          <rect x="9" y="11" width="12" height="2" rx="1" />
          <rect x="9" y="17" width="12" height="2" rx="1" />
        </svg>
      </ToolbarBtn>

      {/* Font size & Print — hidden on mobile */}
      <span className="toolbar-hide-mobile" style={{ display: 'contents' }}>
        <ToolbarSep />

        <div className="toolbar-fontsize">
          <button
            className="toolbar-btn toolbar-btn-sm"
            onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))}
            aria-label="Decrease font size"
            data-tooltip="Decrease font size"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <span className="toolbar-fontsize-val">{fontSize}</span>
          <button
            className="toolbar-btn toolbar-btn-sm"
            onClick={() => onFontSizeChange(Math.min(28, fontSize + 2))}
            aria-label="Increase font size"
            data-tooltip="Increase font size"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        <ToolbarSep />

        <ToolbarBtn onClick={onCopyToClipboard} title="Copy all text">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </ToolbarBtn>

        <ToolbarBtn onClick={onPrint} title="Print (Ctrl+P)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
        </ToolbarBtn>

      </span>

      {/* Share as image — always visible including mobile */}
      <ToolbarSep />
      <ToolbarBtn onClick={onShareImage} title="Share as image">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </ToolbarBtn>
    </div>
  );
});

Toolbar.displayName = 'Toolbar';
