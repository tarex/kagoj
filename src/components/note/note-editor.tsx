import React from 'react';

interface NoteEditorProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  value,
  onChange,
  onKeyPress,
  textareaRef,
}) => {
  return (
    <div className="note-editor">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
        rows={30}
        className="note-textarea"
        placeholder="Start writing your note..."
      />
    </div>
  );
};
