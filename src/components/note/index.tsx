'use client';

import React, { useRef } from 'react';
import { NoteList } from './note-list';
import { NoteEditor } from './note-editor';
import { useNotes } from './use-notes';
import { BanglaInputHandler } from '@/lib/bangla-input-handler';

const NoteComponent: React.FC = () => {
  const {
    notes,
    currentNote,
    selectedNoteIndex,
    setCurrentNote,
    createNewNote,
    selectNote,
    deleteNote,
  } = useNotes();

  const textareaRef = useRef<HTMLTextAreaElement>(null!);
  const banglaIME = BanglaInputHandler.getInstance();

  React.useEffect(() => {
    banglaIME.enable();
  }, [banglaIME]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    banglaIME.handleTextInput(textareaRef, currentNote, setCurrentNote, e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentNote(e.target.value);
  };

  return (
    <div className="note-app">
      <div className="note-sidebar">
        <h2 className="sidebar-title">Notes</h2>
        <button onClick={createNewNote} className="new-note-button">
          + New Note
        </button>
        <NoteList
          notes={notes}
          selectedNoteIndex={selectedNoteIndex}
          onSelect={selectNote}
          onDelete={deleteNote}
        />
      </div>
      <NoteEditor
        value={currentNote}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        textareaRef={textareaRef}
      />
    </div>
  );
};

export default NoteComponent;
