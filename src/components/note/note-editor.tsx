import React, { useEffect, useState } from 'react';

interface NoteEditorProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  fontSize: number;
  suggestion: string;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  value,
  onChange,
  onKeyPress,
  onKeyDown,
  textareaRef,
  fontSize,
  suggestion,
}) => {
  return (
    <div className="note-editor" style={{ position: 'relative' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
        onKeyDown={onKeyDown}
        rows={30}
        className="note-textarea"
        placeholder="Start writing your note..."
        style={{
          fontSize: `${fontSize}px`,
        }}
      />
    </div>
  );
};
