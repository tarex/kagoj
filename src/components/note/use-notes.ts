import { useState, useCallback, useEffect } from 'react';
import throttle from 'lodash.throttle';

interface Note {
  content: string;
  date: string;
}

const SAVE_THROTTLE_TIME = 1000; // 1 second

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<string>('');
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(
    null
  );

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

  return {
    notes,
    currentNote,
    selectedNoteIndex,
    setCurrentNote,
    createNewNote,
    selectNote,
    deleteNote,
    saveNotes,
  };
};
