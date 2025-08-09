'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { NoteList } from './note-list';
import { NoteEditor } from './note-editor';
import { GhostText } from './ghost-text';
import { SpellingOverlay } from './spelling-overlay';
import { Toolbar } from './toolbar';
import { useNotes } from './use-notes';
import { useSpellCheck } from '@/hooks/useSpellCheck';
import { useDebounce } from '@/hooks/useDebounce';
import { BanglaInputHandler } from '@/lib/bangla-input-handler';
import { words } from '@/lib/bangla-suggestion';
import { adaptiveDictionary } from '@/lib/adaptive-dictionary';

const FONT_SIZE_KEY = 'noteFontSize';
const DEFAULT_FONT_SIZE = 16;
const THEME_KEY = 'noteTheme';

const NoteComponent: React.FC = () => {
  const {
    notes,
    currentNote,
    selectedNoteIndex,
    setCurrentNote,
    createNewNote,
    selectNote,
    deleteNote,
    saveCurrentNote,
  } = useNotes();

  const textareaRef = useRef<HTMLTextAreaElement>(null!);
  const banglaInputHandler = BanglaInputHandler.getInstance();
  const [isBanglaMode, setIsBanglaMode] = useState(true);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false); // Default to false to match SSR
  const [isClient, setIsClient] = useState(false); // Track if we're on the client
  const [ghostSuggestion, setGhostSuggestion] = useState<string>('');  // Only one suggestion for ghost text
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use the spell check hook
  const {
    spellingErrors,
    isCheckingSpelling,
    showSpellingErrors,
    checkSpelling,
    scheduleSpellCheck,
    handleSpellingCorrection,
    handleIgnoreSpelling,
  } = useSpellCheck(isBanglaMode);

  const toggleLanguageMode = useCallback(() => {
    setIsBanglaMode((prevMode) => !prevMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem(THEME_KEY, newMode ? 'dark' : 'light');
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newMode;
    });
  }, []);


  // Text formatting helpers
  const insertFormatting = (startTag: string, endTag: string = startTag) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    const newText = text.substring(0, start) + 
                   startTag + selectedText + endTag + 
                   text.substring(end);
    
    setCurrentNote(newText);
    
    // Restore cursor position
    setTimeout(() => {
      if (!selectedText) {
        // If no text was selected, place cursor between tags
        const newPos = start + startTag.length;
        textarea.selectionStart = textarea.selectionEnd = newPos;
      } else {
        // If text was selected, select the formatted text
        textarea.selectionStart = start;
        textarea.selectionEnd = end + startTag.length + endTag.length;
      }
      textarea.focus();
    }, 0);
  };

  const formatBold = useCallback(() => insertFormatting('**'), []);
  const formatItalic = useCallback(() => insertFormatting('*'), []);
  const formatUnderline = useCallback(() => insertFormatting('<u>', '</u>'), []);
  const formatStrikethrough = useCallback(() => insertFormatting('~~'), []);
  const formatCode = useCallback(() => insertFormatting('`'), []);
  const formatHighlight = useCallback(() => insertFormatting('=='), []);
  const insertBullet = useCallback(() => insertFormatting('• ', ''), []);
  const insertNumberedList = useCallback(() => insertFormatting('1. ', ''), []);

  useEffect(() => {
    if (isBanglaMode) {
      banglaInputHandler.enable();
    } else {
      banglaInputHandler.disable();
    }
  }, [banglaInputHandler, isBanglaMode]);
  
  // Debounced auto-learn function
  const learnFromTextDebounced = useDebounce(
    (text: string) => {
      if (text && isBanglaMode) {
        adaptiveDictionary.learnFromText(text);
        console.log('Auto-learned from current text');
      }
    },
    30000, // Learn after 30 seconds of no typing
    [isBanglaMode]
  );
  
  // Trigger learning when text changes
  useEffect(() => {
    if (currentNote) {
      learnFromTextDebounced(currentNote);
    }
  }, [currentNote, learnFromTextDebounced]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'b') {
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
    // Mark that we're on the client
    setIsClient(true);
    
    // Only run on client side
    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY);
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize, 10));
    }

    const savedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    setIsDarkMode(shouldBeDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  
  // Initialize adaptive dictionary on client and learn from notes
  useEffect(() => {
    // Initialize the adaptive dictionary on client side
    adaptiveDictionary.initializeOnClient();
    
    // Learn from all existing notes on initial load
    if (notes.length > 0) {
      console.log('Learning from existing notes...');
      notes.forEach(note => {
        if (note.content) {
          adaptiveDictionary.learnFromText(note.content);
        }
      });
    }
  }, []);


  const updateGhostSuggestionInternal = useCallback((word: string) => {
    console.log('updateGhostSuggestion called with:', word, 'isBanglaMode:', isBanglaMode);
    if (word && word.length >= 1 && isBanglaMode) {
      // Get suggestions from adaptive dictionary with usage counts
      const learnedSuggestions = adaptiveDictionary.getSuggestions(word, 10);
      console.log('Learned suggestions:', learnedSuggestions);
      
      // Get static dictionary matches
      const staticMatches = words.filter(w => 
        w.startsWith(word) && w !== word
      ).slice(0, 10); // Limit to 10 matches
      
      // Combine and prioritize by usage frequency
      const allSuggestions: Array<{word: string, score: number}> = [];
      
      // Add learned words with higher scores based on usage
      learnedSuggestions.forEach(w => {
        const stats = adaptiveDictionary.getWordStats(w);
        allSuggestions.push({
          word: w,
          score: stats ? stats.count * 100 : 10 // Much higher score for frequently used words
        });
      });
      
      // Add static matches with lower scores
      staticMatches.forEach(w => {
        if (!learnedSuggestions.includes(w)) {
          const stats = adaptiveDictionary.getWordStats(w);
          allSuggestions.push({
            word: w,
            score: stats ? stats.count * 100 : 1 // Base score for static words
          });
        }
      });
      
      // Sort by score (highest first)
      allSuggestions.sort((a, b) => b.score - a.score);
      
      console.log('Suggestions sorted by frequency:', allSuggestions.slice(0, 3));
      
      if (allSuggestions.length > 0) {
        // Show the most frequently used match
        const bestMatch = allSuggestions[0].word;
        const completion = bestMatch.substring(word.length);
        console.log('Setting ghost suggestion:', completion, 'from', bestMatch);
        setGhostSuggestion(completion);
      } else {
        setGhostSuggestion('');
      }
    } else {
      setGhostSuggestion('');
    }
  }, [isBanglaMode]);
  
  // Debounced version of updateGhostSuggestion
  const updateGhostSuggestion = useDebounce(updateGhostSuggestionInternal, 150, [updateGhostSuggestionInternal]);

  // Wrapper for spell check hook functions
  const handleSpellCheck = useCallback(() => {
    checkSpelling(currentNote);
  }, [checkSpelling, currentNote]);
  
  const handleCorrection = useCallback((error: any) => {
    handleSpellingCorrection(error, currentNote, setCurrentNote);
    
    // Move cursor after the correction
    if (textareaRef.current) {
      setTimeout(() => {
        const newPos = error.startIndex + error.correction.length;
        textareaRef.current!.selectionStart = textareaRef.current!.selectionEnd = newPos;
        textareaRef.current!.focus();
        console.log('Correction applied successfully');
      }, 0);
    }
  }, [handleSpellingCorrection, currentNote, setCurrentNote]);

  const acceptGhostSuggestion = useCallback(() => {
    if (!ghostSuggestion || !textareaRef.current) return false;
    
    const textarea = textareaRef.current;
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;
    
    // For word suggestions
    let start = cursorPos;
    while (start > 0 && !/[\s\.,;!?।]/.test(text[start - 1])) {
      start--;
    }
    
    const currentWord = text.substring(start, cursorPos);
    const fullWord = currentWord + ghostSuggestion;
    
    // Learn the completed word
    adaptiveDictionary.learnWord(fullWord);
    setGhostSuggestion('');
    
    // Insert the text
    const newText = text.substring(0, cursorPos) + ghostSuggestion + text.substring(cursorPos);
    setCurrentNote(newText);
    
    // Move cursor after the inserted text
    setTimeout(() => {
      const newPos = cursorPos + ghostSuggestion.length;
      textarea.selectionStart = textarea.selectionEnd = newPos;
      textarea.focus();
    }, 0);
    
    return true;
  }, [ghostSuggestion, setCurrentNote]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Tab key for accepting word suggestion
    if (e.key === 'Tab' && ghostSuggestion) {
      e.preventDefault();
      acceptGhostSuggestion();
      return;
    }
    
    // Removed automatic spell checking on Enter key
    
    // Handle Escape key to dismiss ghost suggestion
    if (e.key === 'Escape' && ghostSuggestion) {
      setGhostSuggestion('');
      return;
    }
    
    // Handle formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch(e.key) {
        case 'b':
          if (!e.shiftKey) {
            e.preventDefault();
            formatBold();
            return;
          }
          break;
        case 'i':
          e.preventDefault();
          formatItalic();
          return;
        case 'u':
          e.preventDefault();
          formatUnderline();
          return;
        case 'd':
          e.preventDefault();
          formatStrikethrough();
          return;
        case 'e':
          e.preventDefault();
          formatCode();
          return;
        case 'h':
          e.preventDefault();
          formatHighlight();
          return;
      }
    }
    
    // Process Bangla input (skip for navigation keys)
    const navigationKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];
    if (isBanglaMode && !navigationKeys.includes(e.key)) {
      banglaInputHandler.processInputKeyPress(
        textareaRef,
        currentNote,
        setCurrentNote,
        e
      );
      
      // After Bangla input handler processes, check for suggestions
      setTimeout(() => {
        if (!textareaRef.current) return;
        const textarea = textareaRef.current;
        const text = textarea.value;
        const cursorPos = textarea.selectionStart;
        
        if (cursorPos === text.length) {
          let start = cursorPos;
          while (start > 0 && !/[\s\.,;!?।]/.test(text[start - 1])) {
            start--;
          }
          const word = text.substring(start, cursorPos);
          console.log('After keypress - checking word:', word);
          updateGhostSuggestion(word);
        }
      }, 10);
    }
  };

  // Add a direct input handler to catch actual typed characters
  const handleInput = useCallback((e: any) => {
    console.log('handleInput called, isBanglaMode:', isBanglaMode);
    if (!isBanglaMode) {
      setGhostSuggestion('');
      return;
    }
    
    const textarea = e.target as HTMLTextAreaElement;
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;
    
    console.log('Text:', text, 'Cursor:', cursorPos, 'Length:', text.length);
    
    // Only show suggestions when cursor is at the end of text
    if (cursorPos !== text.length) {
      console.log('Cursor not at end, clearing suggestion');
      setGhostSuggestion('');
      return;
    }
    
    // Find current word at cursor position
    let start = cursorPos;
    while (start > 0 && !/[\s\.,;!?।]/.test(text[start - 1])) {
      start--;
    }
    
    const currentWordAtCursor = text.substring(start, cursorPos);
    console.log('Current word at cursor:', currentWordAtCursor);
    
    // Only update if we have a word
    if (currentWordAtCursor && currentWordAtCursor.length > 0) {
      updateGhostSuggestion(currentWordAtCursor);
    } else {
      setGhostSuggestion('');
    }
  }, [isBanglaMode, updateGhostSuggestion]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const prevValue = currentNote;
    setCurrentNote(value);
    
    // Only re-check spelling if errors are showing and text has changed
    if (showSpellingErrors && value !== prevValue) {
      scheduleSpellCheck(value, 2000); // Re-check after 2 seconds of no typing
    }
    
    // Auto-save after user stops typing for 2 seconds
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        saveCurrentNote();
      }
    }, 2000);
    
    // Auto-learn from text is handled below
    
    // Learn from text when user adds space or punctuation (word boundary)
    if (value.length > prevValue.length) {
      const lastChar = value[value.length - 1];
      
      if (/[\s,;]/.test(lastChar)) {
        // For word boundaries (space, comma, semicolon)
        const beforeBoundary = value.substring(0, value.length - 1);
        const words = beforeBoundary.split(/[\s\.,;!?।]+/);
        const lastWord = words[words.length - 1];
        
        if (lastWord && lastWord.length >= 2) {
          adaptiveDictionary.learnWord(lastWord);
          console.log('Learned word from typing:', lastWord);
        }
        
        // Clear word suggestion
        setGhostSuggestion('');
        
        // Trigger AI suggestion after user types a few words in current sentence
        if (lastChar === ' ' && isBanglaMode) {
          // Find the start of current sentence
          // Don't trigger anything on space for now
        }
      } else if (lastChar === '।' || lastChar === '.' || lastChar === '?' || lastChar === '!') {
        // Sentence ended, clear AI suggestion
        setGhostSuggestion('');
      } else {
        // Check for word suggestions on every change
        if (isBanglaMode) {
          const cursorPos = value.length;
          let start = cursorPos;
          while (start > 0 && !/[\s\.,;!?।]/.test(value[start - 1])) {
            start--;
          }
          const word = value.substring(start, cursorPos);
          console.log('After change - checking word:', word);
          if (word && word.length > 0) {
            // Show word suggestions
            updateGhostSuggestion(word);
          }
        }
      }
    } else {
      // Text was deleted, clear suggestions
      setGhostSuggestion('');
      
    }
  }, [currentNote, showSpellingErrors, scheduleSpellCheck, selectedNoteIndex, saveCurrentNote, isBanglaMode, setGhostSuggestion, updateGhostSuggestion]);

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <header className="topbar">
        <h1 className="topbar-title">কাগজ</h1>
        
        <div className="topbar-controls">
          {/* Language Toggle */}
          <div className="flex-center gap-3">
            <button
              onClick={toggleLanguageMode}
              className={`toggle-switch ${isBanglaMode ? 'active' : ''}`}
              aria-label="Toggle language"
            >
              <span className="toggle-switch-handle" />
            </button>
            <div className="toggle-label">
              <span className="toggle-label-main">
                {isBanglaMode ? 'বাংলা' : 'English'}
              </span>
              <span className="toggle-label-sub">Ctrl+Shift+B</span>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex-center gap-3">
            <button
              onClick={toggleTheme}
              className={`toggle-switch ${isDarkMode ? 'active' : ''}`}
              aria-label="Toggle theme"
              disabled={!isClient}
            >
              <span className="toggle-switch-handle">
                {isClient && isDarkMode ? (
                  <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
            </button>
            <div className="toggle-label">
              <span className="toggle-label-main">
                {isClient && isDarkMode ? 'Dark' : 'Light'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <button
              onClick={createNewNote}
              className="btn-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>নতুন কাগজ</span>
            </button>
          </div>
          
          <div className="sidebar-content">
            <h2 className="sidebar-title">সকল নোট</h2>
            <NoteList
              notes={notes}
              selectedNoteIndex={selectedNoteIndex}
              onSelect={selectNote}
              onDelete={deleteNote}
            />
          </div>
        </aside>

        {/* Editor Container */}
        <div className="editor-container">
          {/* Editor Toolbar */}
          <Toolbar
            onFormatBold={formatBold}
            onFormatItalic={formatItalic}
            onFormatUnderline={formatUnderline}
            onFormatStrikethrough={formatStrikethrough}
            onFormatCode={formatCode}
            onFormatHighlight={formatHighlight}
            onInsertBullet={insertBullet}
            onInsertNumberedList={insertNumberedList}
            onCheckSpelling={handleSpellCheck}
            isCheckingSpelling={isCheckingSpelling}
            isBanglaMode={isBanglaMode}
          />

          {/* Editor Main Area */}
          <div className="editor-main" style={{ position: 'relative' }}>
            <div className="editor-wrapper">
              {/* Spell Check Loading Indicator */}
              {isCheckingSpelling && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  zIndex: 100,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  animation: 'pulse 1.5s infinite',
                }}>
                  <span style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'white',
                    animation: 'blink 1s infinite',
                  }}></span>
                  ✔️ Checking spelling...
                </div>
              )}
              
              {/* Removed Spelling Errors Indicator Alert Box */}
              
              <NoteEditor
                suggestions={words}
                value={currentNote}
                onChange={handleChange}
                onKeyDown={handleKeyPress}
                onInput={handleInput}
                textareaRef={textareaRef}
                fontSize={fontSize}
              />
              {ghostSuggestion && (
                <GhostText
                  currentText={currentNote}
                  suggestion={ghostSuggestion}
                  fontSize={fontSize}
                  textareaRef={textareaRef}
                  isAISuggestion={false}
                />
              )}
              {/* Spelling Error Overlay */}
              {showSpellingErrors && spellingErrors.length > 0 && (
                <SpellingOverlay
                  text={currentNote}
                  errors={spellingErrors}
                  textareaRef={textareaRef}
                  fontSize={fontSize}
                  onCorrect={handleCorrection}
                  onIgnore={handleIgnoreSpelling}
                />
              )}
              {/* Debug info */}
              <div style={{
                position: 'fixed',
                bottom: 10,
                right: 10,
                padding: '10px',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                fontSize: '12px',
                borderRadius: '5px',
                zIndex: 9999,
              }}>
                <div>Mode: {isBanglaMode ? 'বাংলা' : 'English'}</div>
                <div>Ghost: "{ghostSuggestion ? ghostSuggestion.substring(0, 30) + '...' : ''}"</div>
                <div>Spelling: {isCheckingSpelling ? 'Checking...' : `${spellingErrors.length} errors`}</div>
                <div>Text length: {currentNote.length}</div>
                <div style={{ marginTop: '5px', fontSize: '10px', opacity: 0.8 }}>
                  Dictionary: {adaptiveDictionary.getStats().totalWords} words
                  <br />
                  Learned: {adaptiveDictionary.getStats().learnedWords} words
                </div>
                {ghostSuggestion && (
                  <div style={{ marginTop: '5px', padding: '4px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '3px', fontSize: '10px' }}>
                    <div>🎯 Tab: Complete word</div>
                    <div>❌ Escape: Dismiss</div>
                  </div>
                )}
                {spellingErrors.length > 0 && (
                  <div style={{ marginTop: '5px', padding: '4px', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '3px', fontSize: '10px' }}>
                    <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>Spelling Errors:</div>
                    {spellingErrors.slice(0, 3).map((error, i) => (
                      <div key={i}>{error.word} → {error.correction}</div>
                    ))}
                    {spellingErrors.length > 3 && <div>...and {spellingErrors.length - 3} more</div>}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
                  <button
                    onClick={() => {
                      // Test with some Bengali words
                      const testWords = ['আম', 'তু', 'কর', 'বাং', 'দে'];
                      const word = testWords[Math.floor(Math.random() * testWords.length)];
                      console.log('Testing with word:', word);
                      updateGhostSuggestion(word);
                    }}
                    style={{
                      padding: '4px 8px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px',
                    }}
                  >
                    Test Word
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔍 MANUAL SPELL CHECK TEST TRIGGERED');
                      console.log('Running spell check test');
                      checkSpelling(); // Check entire document
                    }}
                    style={{
                      padding: '4px 8px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px',
                    }}
                  >
                    Test Spell Check
                  </button>
                  <button
                    onClick={() => {
                      adaptiveDictionary.clearLearnedWords();
                      alert('Cleared all learned words!');
                    }}
                    style={{
                      padding: '4px 8px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px',
                    }}
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => {
                      // Learn from current note
                      if (currentNote) {
                        adaptiveDictionary.learnFromText(currentNote);
                        console.log('Learned from current text');
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px',
                    }}
                  >
                    Learn
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteComponent;