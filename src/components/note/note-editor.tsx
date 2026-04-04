import React from 'react';

interface NoteEditorProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onBeforeInput?: (e: React.FormEvent<HTMLTextAreaElement>) => void;
  onInput?: (e: React.FormEvent<HTMLTextAreaElement>) => void;
  onCompositionStart?: (e: React.CompositionEvent<HTMLTextAreaElement>) => void;
  onCompositionEnd?: (e: React.CompositionEvent<HTMLTextAreaElement>) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  fontSize: number;
}

export const NoteEditor = React.memo<NoteEditorProps>(({
  value,
  onChange,
  onKeyDown,
  onBeforeInput,
  onInput,
  onCompositionStart,
  onCompositionEnd,
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
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
      className="text-editor"
      placeholder="বাংলায় লিখুন..."
      spellCheck={false}
      autoCorrect="off"
      autoCapitalize="off"
      style={{
        fontSize: `${fontSize}px`,
      }}
    />
  );
});

NoteEditor.displayName = 'NoteEditor';
