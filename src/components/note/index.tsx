'use client';

import React, { useRef, useState, useEffect } from 'react';
import { NoteList } from './note-list';
import { NoteEditor } from './note-editor';
import { useNotes } from './use-notes';
import { BanglaInputHandler } from '@/lib/bangla-input-handler';
import { words } from '@/lib/bangla-suggestion';

const FONT_SIZE_KEY = 'noteFontSize';
const DEFAULT_FONT_SIZE = 16;

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
  const banglaInputHandler = BanglaInputHandler.getInstance();
  const [isBanglaMode, setIsBanglaMode] = useState(true);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);

  const toggleLanguageMode = () => {
    setIsBanglaMode((prevMode) => !prevMode);
  };

  const increaseFontSize = () => {
    setFontSize((prevSize) => {
      const newSize = prevSize + 1;
      localStorage.setItem(FONT_SIZE_KEY, newSize.toString());
      return newSize;
    });
  };

  const decreaseFontSize = () => {
    setFontSize((prevSize) => {
      const newSize = Math.max(10, prevSize - 1);
      localStorage.setItem(FONT_SIZE_KEY, newSize.toString());
      return newSize;
    });
  };

  useEffect(() => {
    if (isBanglaMode) {
      banglaInputHandler.enable();
    } else {
      banglaInputHandler.disable();
    }
  }, [banglaInputHandler, isBanglaMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        toggleLanguageMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY);
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize, 10));
    }
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isBanglaMode) {
      banglaInputHandler.processInputKeyPress(
        textareaRef,
        currentNote,
        setCurrentNote,
        e
      );
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCurrentNote(value);
  };

  return (
    <div className="note-app">
      <div className="note-topbar">
        <h1 className="app-title">কাগজ</h1>
        <div className="language-toggle-container">
          <label className="switch">
            <input
              type="checkbox"
              checked={isBanglaMode}
              onChange={toggleLanguageMode}
            />
            <span className="slider round"></span>
          </label>
          <span className="language-label mr-2">
            {isBanglaMode ? 'বাংলা' : 'ইংরেজি'}
          </span>
          <span className="shortcut-info">(Ctrl + B)</span>
        </div>
      </div>
      <div className="editor-toolbar">
        <button onClick={increaseFontSize} className="toolbar-button">
          A+
        </button>
        <button onClick={decreaseFontSize} className="toolbar-button">
          A-
        </button>
      </div>
      <div className="note-content">
        <div className="note-sidebar">
          <button onClick={createNewNote} className="new-note-button">
            + নতুন কাগজ
          </button>
          <NoteList
            notes={notes}
            selectedNoteIndex={selectedNoteIndex}
            onSelect={selectNote}
            onDelete={deleteNote}
          />
        </div>
        <NoteEditor
          suggestions={words}
          value={currentNote}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          textareaRef={textareaRef}
          fontSize={fontSize}
        />
      </div>
    </div>
  );
};

export default NoteComponent;
