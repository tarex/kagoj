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
  const [isInitialized, setIsInitialized] = useState(false);

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
      
      // Load current unsaved note from localStorage
      const savedCurrentNote = localStorage.getItem('currentNote');
      if (savedCurrentNote) {
        setCurrentNote(savedCurrentNote);
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to parse notes from local storage:', error);
      setNotes([]);
      setIsInitialized(true);
    }
  }, []);
  
  // Save current note to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('currentNote', currentNote);
    }
  }, [currentNote, isInitialized]);

  const createNewNote = () => {
    // Save current note if it has content
    if (currentNote.trim()) {
      if (selectedNoteIndex !== null) {
        // We're already editing a note, just save it
        const updatedNotes = [...notes];
        updatedNotes[selectedNoteIndex] = {
          ...updatedNotes[selectedNoteIndex],
          content: currentNote,
        };
        setNotes(updatedNotes);
        saveNotes(updatedNotes);
      } else {
        // Create a new note from current content
        const newNote: Note = {
          content: currentNote,
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
        date: new Date().toISOString(),
      };
      const updatedNotes = [newNote, ...notes];
      setNotes(updatedNotes);
      saveNotes(updatedNotes);
      // Select the newly created empty note
      setSelectedNoteIndex(0);
    }
    
    // Clear content for the new note
    setCurrentNote('');
    localStorage.removeItem('currentNote'); // Clear current note from localStorage
  };
  
  const saveCurrentNote = () => {
    // Save the current note if it has content
    if (currentNote.trim()) {
      if (selectedNoteIndex === null) {
        // Create a new note
        const newNote: Note = {
          content: currentNote,
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
        };
        setNotes(updatedNotes);
        saveNotes(updatedNotes);
      }
    }
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
      localStorage.removeItem('currentNote');
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

  return {
    notes,
    currentNote,
    selectedNoteIndex,
    setCurrentNote: updateCurrentNote,
    createNewNote,
    selectNote,
    deleteNote,
    saveNotes,
    saveCurrentNote,
  };
};
