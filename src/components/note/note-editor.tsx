import React from 'react';

interface NoteEditorProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onInput?: (e: any) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  fontSize: number;
  suggestions: string[];
}

export const NoteEditor = React.memo<NoteEditorProps>(({
  value,
  onChange,
  onKeyDown,
  onInput,
  textareaRef,
  fontSize,
}) => {
  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onInput={onInput}
      className="text-editor"
      placeholder="বাংলায় লিখুন..."
      style={{
        fontSize: `${fontSize}px`,
      }}
    />
  );
});

NoteEditor.displayName = 'NoteEditor';