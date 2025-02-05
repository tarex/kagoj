'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import throttle from 'lodash.throttle';
import { BanglaIME } from '@/lib/input/bangla-ime';
import { contextPatterns } from '@/lib/input/context-pattern';

const MAX_LINES_PER_PAGE = 30;
const SAVE_THROTTLE_TIME = 1000; // 1 second

interface Note {
  content: string;
  date: string;
}

const NoteComponent = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<string>('');
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(
    null
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const banglaIME = useRef<BanglaIME>(new BanglaIME(contextPatterns));

  // Enable IME by default
  useEffect(() => {
    banglaIME.current.enable();
  }, []);

  // Throttled save function
  const saveNotes = useCallback(
    throttle((notesToSave: Note[]) => {
      localStorage.setItem('notes', JSON.stringify(notesToSave));
    }, SAVE_THROTTLE_TIME),
    []
  );

  useEffect(() => {
    try {
      const savedNotes = JSON.parse(localStorage.getItem('notes') || '[]');
      if (Array.isArray(savedNotes)) {
        setNotes(savedNotes);
      }
    } catch (error) {
      console.error('Failed to parse notes from local storage:', error);
      setNotes([]);
    }
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const text = currentNote;
    const typedChar = e.key;

    // Get the text before cursor for IME processing
    const beforeCursor = text.slice(0, cursorPosition);
    const afterCursor = text.slice(cursorPosition);

    // Handle the keypress through BanglaIME
    const convertedText = banglaIME.current.handleKeyPress(
      beforeCursor,
      typedChar
    );

    // Calculate the actual change in text
    const finalText = convertedText + afterCursor;
    setCurrentNote(finalText);

    // Update notes array if editing existing note
    if (selectedNoteIndex !== null) {
      const updatedNotes = notes.map((note, index) =>
        index === selectedNoteIndex
          ? { ...note, content: finalText, date: new Date().toISOString() }
          : note
      );
      setNotes(updatedNotes);
      saveNotes(updatedNotes);
    }

    // Move cursor position forward by the length difference of the conversion
    const newPosition =
      cursorPosition + (convertedText.length - beforeCursor.length);

    // Set cursor position for next input
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newPosition;
        textareaRef.current.selectionEnd = newPosition;
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Handle paste events and other non-keypress changes
    setCurrentNote(e.target.value);
  };

  const createNewNote = () => {
    if (currentNote.trim()) {
      const newNote: Note = {
        content: currentNote,
        date: new Date().toISOString(),
      };
      const updatedNotes = [newNote, ...notes];
      setNotes(updatedNotes);
      saveNotes(updatedNotes);
    }
    setCurrentNote('');
    setSelectedNoteIndex(null);
  };

  const selectNote = (index: number) => {
    setSelectedNoteIndex(index);
    setCurrentNote(notes[index].content);
  };

  const deleteNote = (index: number) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    if (index === selectedNoteIndex) {
      setCurrentNote('');
      setSelectedNoteIndex(null);
    }
  };

  return (
    <div className="note-app">
      <div className="note-sidebar">
        <h2 className="sidebar-title">Notes</h2>
        <button onClick={createNewNote} className="new-note-button">
          + New Note
        </button>
        <div className="notes-list">
          {notes.map((note, index) => (
            <div
              key={index}
              className={`note-item ${
                index === selectedNoteIndex ? 'selected' : ''
              }`}
              onClick={() => selectNote(index)}
            >
              <div className="note-date">
                {new Date(note.date).toLocaleString()}
              </div>
              <div className="note-content-preview">
                {note.content
                  ? note.content.slice(0, 30) + '...'
                  : 'Empty note'}
              </div>
              <div className="note-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(index);
                  }}
                  className="delete-button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="note-editor">
        <textarea
          ref={textareaRef}
          value={currentNote}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          rows={MAX_LINES_PER_PAGE}
          className="note-textarea"
          placeholder="Start writing your note..."
        />
      </div>
    </div>
  );
};

export default NoteComponent;
