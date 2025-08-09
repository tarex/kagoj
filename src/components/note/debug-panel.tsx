import React from 'react';

interface DebugPanelProps {
  currentWord: string;
  suggestions: string[];
  showSuggestions: boolean;
  isBanglaMode: boolean;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  currentWord,
  suggestions,
  showSuggestions,
  isBanglaMode,
}) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      padding: '12px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999,
    }}>
      <div>🔍 Debug Info</div>
      <div>Mode: {isBanglaMode ? 'বাংলা' : 'English'}</div>
      <div>Current Word: "{currentWord}"</div>
      <div>Show Suggestions: {showSuggestions ? 'Yes' : 'No'}</div>
      <div>Suggestions ({suggestions.length}):</div>
      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
        {suggestions.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
};