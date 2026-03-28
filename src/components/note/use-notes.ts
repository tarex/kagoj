import { useState, useCallback, useEffect } from 'react';
import throttle from 'lodash.throttle';

interface Note {
  content: string;
  date: string;
  title: string;
}

const SAVE_THROTTLE_TIME = 1000; // 1 second

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<string>('');
  const [currentTitle, setCurrentTitleState] = useState<string>('');
  const [selectedNoteIndex, setSelectedNoteIndexState] = useState<number | null>(
    null
  );
  const [isInitialized, setIsInitialized] = useState(false);

  const setSelectedNoteIndex = useCallback((index: number | null) => {
    setSelectedNoteIndexState(index);
    if (index !== null) {
      localStorage.setItem('selectedNoteIndex', String(index));
    } else {
      localStorage.removeItem('selectedNoteIndex');
    }
  }, []);

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
        // Migration: ensure every note has a title field
        const migratedNotes: Note[] = savedNotes.map((note: Partial<Note>) => ({
          content: note.content ?? '',
          date: note.date ?? new Date().toISOString(),
          title: note.title ?? '',
        }));
        setNotes(migratedNotes);
      }

      // Load current unsaved note and title from localStorage
      const savedCurrentNote = localStorage.getItem('currentNote');
      if (savedCurrentNote) {
        setCurrentNote(savedCurrentNote);
      }
      const savedCurrentTitle = localStorage.getItem('currentTitle');
      if (savedCurrentTitle) {
        setCurrentTitleState(savedCurrentTitle);
      }

      const savedIndex = localStorage.getItem('selectedNoteIndex');
      if (savedIndex !== null) {
        const index = parseInt(savedIndex, 10);
        if (!isNaN(index) && Array.isArray(savedNotes) && index >= 0 && index < savedNotes.length) {
          setSelectedNoteIndexState(index);
        } else {
          localStorage.removeItem('selectedNoteIndex');
        }
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to parse notes from local storage:', error);
      setNotes([]);
      setIsInitialized(true);
    }
  }, []);

  // Save current note and title to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('currentNote', currentNote);
    }
  }, [currentNote, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('currentTitle', currentTitle);
    }
  }, [currentTitle, isInitialized]);

  const createNewNote = () => {
    // Save current note if it has content or title
    if (currentNote.trim() || currentTitle.trim()) {
      if (selectedNoteIndex !== null) {
        // We're already editing a note, just save it
        const updatedNotes = [...notes];
        updatedNotes[selectedNoteIndex] = {
          ...updatedNotes[selectedNoteIndex],
          content: currentNote,
          title: currentTitle,
        };
        setNotes(updatedNotes);
        saveNotes(updatedNotes);
      } else {
        // Create a new note from current content
        const newNote: Note = {
          content: currentNote,
          title: currentTitle,
          date: new Date().toISOString(),
        };
        const updatedNotes = [newNote, ...notes];
        setNotes(updatedNotes);
        saveNotes(updatedNotes);
      }
      // Always select the newly created note (index 0)
      setSelectedNoteIndex(0);
    } else {
      // Create an empty note
      const newNote: Note = {
        content: '',
        title: '',
        date: new Date().toISOString(),
      };
      const updatedNotes = [newNote, ...notes];
      setNotes(updatedNotes);
      saveNotes(updatedNotes);
      // Select the newly created empty note
      setSelectedNoteIndex(0);
    }

    // Clear content and title for the new note
    setCurrentNote('');
    setCurrentTitleState('');
    localStorage.removeItem('currentNote');
    localStorage.removeItem('currentTitle');
  };

  const saveCurrentNote = () => {
    // Save the current note if it has content or title
    if (currentNote.trim() || currentTitle.trim()) {
      if (selectedNoteIndex === null) {
        // Create a new note
        const newNote: Note = {
          content: currentNote,
          title: currentTitle,
          date: new Date().toISOString(),
        };
        const updatedNotes = [newNote, ...notes];
        setNotes(updatedNotes);
        saveNotes(updatedNotes);
        // Select the newly created note
        setSelectedNoteIndex(0);
      } else {
        // Update existing note
        const updatedNotes = [...notes];
        updatedNotes[selectedNoteIndex] = {
          ...updatedNotes[selectedNoteIndex],
          content: currentNote,
          title: currentTitle,
        };
        setNotes(updatedNotes);
        saveNotes(updatedNotes);
      }
    }
  };

  const selectNote = (index: number) => {
    setSelectedNoteIndex(index);
    setCurrentNote(notes[index].content);
    setCurrentTitleState(notes[index].title ?? '');
  };

  const deleteNote = (index: number) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    if (index === selectedNoteIndex) {
      setCurrentNote('');
      setCurrentTitleState('');
      setSelectedNoteIndex(null);
      localStorage.removeItem('currentNote');
      localStorage.removeItem('currentTitle');
    } else if (selectedNoteIndex !== null && index < selectedNoteIndex) {
      // Adjust selected index if we deleted a note before the selected one
      setSelectedNoteIndex(selectedNoteIndex - 1);
    }
  };

  // Update existing note when content changes
  const updateCurrentNote = useCallback((newContent: string) => {
    setCurrentNote(newContent);

    // If we're editing an existing note, update it in the list
    if (selectedNoteIndex !== null && notes[selectedNoteIndex]) {
      const updatedNotes = [...notes];
      updatedNotes[selectedNoteIndex] = {
        ...updatedNotes[selectedNoteIndex],
        content: newContent,
      };
      setNotes(updatedNotes);
      saveNotes(updatedNotes);
    }
  }, [selectedNoteIndex, notes, saveNotes]);

  // Update existing note when title changes
  const updateCurrentTitle = useCallback((newTitle: string) => {
    setCurrentTitleState(newTitle);

    // If we're editing an existing note, update it in the list
    if (selectedNoteIndex !== null && notes[selectedNoteIndex]) {
      const updatedNotes = [...notes];
      updatedNotes[selectedNoteIndex] = {
        ...updatedNotes[selectedNoteIndex],
        title: newTitle,
      };
      setNotes(updatedNotes);
      saveNotes(updatedNotes);
    }
  }, [selectedNoteIndex, notes, saveNotes]);

  return {
    notes,
    currentNote,
    currentTitle,
    selectedNoteIndex,
    setCurrentNote: updateCurrentNote,
    setCurrentTitle: updateCurrentTitle,
    createNewNote,
    selectNote,
    deleteNote,
    saveNotes,
    saveCurrentNote,
  };
};
