import React from 'react';

interface NoteEditorProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onBeforeInput?: (e: React.FormEvent<HTMLTextAreaElement>) => void;
  onInput?: (e: React.FormEvent<HTMLTextAreaElement>) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  fontSize: number;
}

export const NoteEditor = React.memo<NoteEditorProps>(({
  value,
  onChange,
  onKeyDown,
  onBeforeInput,
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
      onBeforeInput={onBeforeInput}
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
