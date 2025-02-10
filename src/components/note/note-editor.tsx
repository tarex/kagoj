import React from 'react';
import { BanglaInputHandler } from '../../lib/bangla-input-handler';

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
  const banglaHandler: BanglaInputHandler = BanglaInputHandler.getInstance();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (banglaHandler.isActive()) {
      banglaHandler.processInputKeyPress(
        textareaRef,
        value,
        (updated) => {
          onChange({
            // Mimic React's ChangeEvent
            // This is just a demonstration,
            // you can adapt to your state management
            target: { value: updated },
          } as React.ChangeEvent<HTMLTextAreaElement>);
        },
        e
      );
    } else {
      onKeyDown(e);
    }
  };

  return (
    <div className="note-editor" style={{ position: 'relative' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
        onKeyDown={handleKeyDown}
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
