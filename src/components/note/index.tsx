'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { NoteList } from './note-list';
import { NoteEditor } from './note-editor';
import { GhostText } from './ghost-text';
import { SpellingOverlay } from './spelling-overlay';
import { WordSuggestionPopup } from './word-suggestion-popup';
import { Toolbar } from './toolbar';
import { KeyboardShortcutsPanel } from './keyboard-shortcuts-panel';
import { Onboarding } from './onboarding';
import { useNotes } from './use-notes';
import { useSpellCheck } from '@/hooks/useSpellCheck';
import { useDebounce } from '@/hooks/useDebounce';
import { useAISuggestion, AI_TRIGGER_DELAY_MS } from '@/hooks/useAISuggestion';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { BanglaInputHandler } from '@/lib/bangla-input-handler';
import { adaptiveDictionary } from '@/lib/adaptive-dictionary';
import { bigramStore } from '@/lib/bigram-store';
import { banglaCollocations } from '@/lib/bangla-collocations';

const FONT_SIZE_KEY = 'noteFontSize';
const DEFAULT_FONT_SIZE = 28;
const THEME_KEY = 'noteTheme';

/** Extract the previous Bangla word before a given position in text */
function getPrevWord(text: string, wordStart: number): string | undefined {
  // Walk backwards from wordStart, skip whitespace, then find word boundary
  let end = wordStart;
  while (end > 0 && /[\s\.,;!?।]/.test(text[end - 1])) end--;
  if (end === 0) return undefined;
  let start = end;
  while (start > 0 && !/[\s\.,;!?।]/.test(text[start - 1])) start--;
  const word = text.substring(start, end);
  return word.length >= 2 ? word : undefined;
}

const NoteComponent: React.FC = () => {
  const {
    notes,
    currentNote,
    currentTitle,
    selectedNoteIndex,
    setCurrentNote,
    setCurrentTitle,
    createNewNote,
    selectNote,
    deleteNote,
    saveCurrentNote,
  } = useNotes();

  const textareaRef = useRef<HTMLTextAreaElement>(null!);
  const titleInputRef = useRef<HTMLInputElement>(null!);
  const banglaInputHandler = BanglaInputHandler.getInstance();
  const [isBanglaMode, setIsBanglaMode] = useState(true);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false); // Default to false to match SSR
  const [isClient, setIsClient] = useState(false); // Track if we're on the client
  const [ghostSuggestion, setGhostSuggestion] = useState<string>('');  // Only one suggestion for ghost text
  const [ghostCursorPos, setGhostCursorPos] = useState<number>(0); // Where the ghost suggestion should render
  const [isAISuggestionActive, setIsAISuggestionActive] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aiTriggerRef = useRef<NodeJS.Timeout | null>(null);

  const { aiSuggestion, isLoadingAI: _isLoadingAI, requestAISuggestion, clearAISuggestion } = useAISuggestion(isBanglaMode);
  
  // Use the spell check hook
  const {
    spellingErrors,
    showSpellingErrors,
    scheduleSpellCheck,
    handleSpellingCorrection,
    handleIgnoreSpelling,
    getWordSuggestions,
    clearSpellCheck,
  } = useSpellCheck(isBanglaMode);

  const { pushSnapshot, undo, redo, canUndo, canRedo, resetHistory } = useUndoRedo();

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

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

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    const entry = undo();
    if (!entry) return;
    setCurrentNote(entry.text);
    setCurrentTitle(entry.title);
    if (textareaRef.current) {
      setTimeout(() => {
        textareaRef.current!.selectionStart = textareaRef.current!.selectionEnd = entry.cursorPos;
        textareaRef.current!.focus();
      }, 0);
    }
  }, [undo, setCurrentNote, setCurrentTitle]);

  const handleRedo = useCallback(() => {
    const entry = redo();
    if (!entry) return;
    setCurrentNote(entry.text);
    setCurrentTitle(entry.title);
    if (textareaRef.current) {
      setTimeout(() => {
        textareaRef.current!.selectionStart = textareaRef.current!.selectionEnd = entry.cursorPos;
        textareaRef.current!.focus();
      }, 0);
    }
  }, [redo, setCurrentNote, setCurrentTitle]);

  // Print handler — expand textarea to full content height before printing
  const handlePrint = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const prevHeight = textarea.style.height;
      const prevOverflow = textarea.style.overflow;
      textarea.style.height = `${textarea.scrollHeight}px`;
      textarea.style.overflow = 'visible';
      // Wait for repaint so the browser captures the expanded height
      requestAnimationFrame(() => {
        window.print();
        textarea.style.height = prevHeight;
        textarea.style.overflow = prevOverflow;
      });
    } else {
      window.print();
    }
  }, []);

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
        bigramStore.learnFromText(text);
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
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+Shift+B — Toggle Bangla/English
      if (ctrl && e.shiftKey && e.key === 'b') {
        e.preventDefault();
        toggleLanguageMode();
        return;
      }

      // Ctrl+Shift+D — Delete current note
      if (ctrl && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        if (selectedNoteIndex !== null && selectedNoteIndex >= 0) {
          deleteNote(selectedNoteIndex);
        }
        return;
      }

      // Ctrl+Shift+T — Toggle theme
      if (ctrl && e.shiftKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        toggleTheme();
        return;
      }

      // Ctrl+N — New note
      if (ctrl && !e.shiftKey && e.key === 'n') {
        e.preventDefault();
        createNewNote();
        return;
      }

      // Ctrl+S — Save
      if (ctrl && !e.shiftKey && e.key === 's') {
        e.preventDefault();
        saveCurrentNote();
        return;
      }

      // Ctrl+Z — Undo
      if (ctrl && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl+Shift+Z or Ctrl+Y — Redo
      if (ctrl && (e.key === 'y' || (e.shiftKey && e.key === 'z') || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Ctrl+P — Print
      if (ctrl && !e.shiftKey && e.key === 'p') {
        e.preventDefault();
        handlePrint();
        return;
      }

      // Ctrl+/ — Toggle shortcuts panel
      if (ctrl && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNoteIndex, deleteNote, createNewNote, saveCurrentNote, toggleLanguageMode, toggleTheme, handleUndo, handleRedo, handlePrint]);

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
    adaptiveDictionary.initializeOnClient();
    bigramStore.initializeOnClient();
    bigramStore.seed(banglaCollocations);

    // Learn from all existing notes on initial load
    if (notes.length > 0) {
      notes.forEach(note => {
        if (note.content) {
          adaptiveDictionary.learnFromText(note.content);
          bigramStore.learnFromText(note.content);
        }
      });
    }
  }, []);

  // Clear spell-check errors and reset undo history when switching notes
  useEffect(() => {
    clearSpellCheck();
    resetHistory(currentNote, currentTitle, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset on note switch, not on every text change
  }, [selectedNoteIndex, clearSpellCheck, resetHistory]);

  // Sync AI suggestion into ghost suggestion state
  useEffect(() => {
    if (aiSuggestion) {
      setGhostSuggestion(aiSuggestion);
      setIsAISuggestionActive(true);
    }
  }, [aiSuggestion]);


  const updateGhostSuggestionInternal = useCallback((word: string, prevWord?: string, cursorPos?: number) => {
    if (word && word.length >= 1 && isBanglaMode) {
      // Get trie-based suggestions (unigram)
      const trieSuggestions = adaptiveDictionary.getSuggestions(word, 10);

      // Get bigram-boosted suggestions if we have a previous word
      let bestMatch: string | undefined;
      if (prevWord) {
        const bigramHits = bigramStore.getSuggestionsWithPrefix(prevWord, word, 5);
        if (bigramHits.length > 0) {
          bestMatch = bigramHits[0];
        }
      }

      // Fall back to trie if no bigram match
      if (!bestMatch && trieSuggestions.length > 0) {
        bestMatch = trieSuggestions[0];
      }

      if (bestMatch) {
        const completion = bestMatch.substring(word.length);
        setGhostSuggestion(completion);
        setGhostCursorPos(cursorPos ?? 0);
        setIsAISuggestionActive(false);
      } else {
        setGhostSuggestion('');
        setIsAISuggestionActive(false);
      }
    } else {
      setGhostSuggestion('');
      setIsAISuggestionActive(false);
    }
  }, [isBanglaMode]);
  
  // Direct call — trie lookup is O(prefix) and fast enough without debounce
  const updateGhostSuggestion = updateGhostSuggestionInternal;

  const handleCorrection = useCallback((error: any) => {
    handleSpellingCorrection(error, currentNote, setCurrentNote);
    
    // Move cursor after the correction
    if (textareaRef.current) {
      setTimeout(() => {
        const newPos = error.startIndex + error.correction.length;
        textareaRef.current!.selectionStart = textareaRef.current!.selectionEnd = newPos;
        textareaRef.current!.focus();
      }, 0);
    }
  }, [handleSpellingCorrection, currentNote, setCurrentNote]);

  const handleWordReplace = useCallback((start: number, end: number, replacement: string) => {
    const text = currentNote;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setCurrentNote(newText);

    if (textareaRef.current) {
      setTimeout(() => {
        const newPos = start + replacement.length;
        textareaRef.current!.selectionStart = textareaRef.current!.selectionEnd = newPos;
        textareaRef.current!.focus();
      }, 0);
    }
  }, [currentNote, setCurrentNote]);

  const acceptGhostSuggestion = useCallback(() => {
    if (!ghostSuggestion || !textareaRef.current) return false;

    const textarea = textareaRef.current;
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;

    if (isAISuggestionActive) {
      // AI suggestion: insert full ghost suggestion text at cursor position
      clearAISuggestion();
      setGhostSuggestion('');
      setIsAISuggestionActive(false);

      const newText = text.substring(0, cursorPos) + ghostSuggestion + text.substring(cursorPos);
      setCurrentNote(newText);

      setTimeout(() => {
        const newPos = cursorPos + ghostSuggestion.length;
        textarea.selectionStart = textarea.selectionEnd = newPos;
        textarea.focus();
      }, 0);
    } else {
      // Dictionary suggestion: word completion path
      let start = cursorPos;
      while (start > 0 && !/[\s\.,;!?।]/.test(text[start - 1])) {
        start--;
      }

      const currentWord = text.substring(start, cursorPos);
      const fullWord = currentWord + ghostSuggestion;

      // Learn the completed word
      adaptiveDictionary.learnWord(fullWord);
      setGhostSuggestion('');
      setIsAISuggestionActive(false);

      // Insert the ghost text (completion suffix)
      const newText = text.substring(0, cursorPos) + ghostSuggestion + text.substring(cursorPos);
      setCurrentNote(newText);

      setTimeout(() => {
        const newPos = cursorPos + ghostSuggestion.length;
        textarea.selectionStart = textarea.selectionEnd = newPos;
        textarea.focus();
      }, 0);
    }

    return true;
  }, [ghostSuggestion, isAISuggestionActive, clearAISuggestion, setCurrentNote]);

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
      clearAISuggestion();
      setIsAISuggestionActive(false);
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
    
    // Process Bangla input (skip for navigation keys and Delete)
    const skipKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', 'Delete'];

    // Clear ghost on cursor movement — suggestion is position-dependent
    if (skipKeys.includes(e.key)) {
      setGhostSuggestion('');
      setIsAISuggestionActive(false);
      return;
    }

    // Let browser handle Backspace/Delete natively when text is selected
    const hasSelection = textareaRef.current &&
      textareaRef.current.selectionStart !== textareaRef.current.selectionEnd;
    if (hasSelection && (e.key === 'Backspace' || e.key === 'Delete')) {
      setGhostSuggestion('');
      return;
    }
    if (isBanglaMode && !skipKeys.includes(e.key)) {
      banglaInputHandler.processInputKeyPress(
        textareaRef,
        currentNote,
        setCurrentNote,
        e
      );

      // processInputKeyPress calls preventDefault(), so handleChange won't fire.
      // Compute ghost suggestion from the DOM which was updated synchronously.
      requestAnimationFrame(() => {
        if (!textareaRef.current) return;
        const textarea = textareaRef.current;
        const text = textarea.value;
        const cursorPos = textarea.selectionStart;

        let start = cursorPos;
        while (start > 0 && !/[\s\.,;!?।]/.test(text[start - 1])) {
          start--;
        }
        const word = text.substring(start, cursorPos);
        if (word) {
          updateGhostSuggestion(word, getPrevWord(text, start), cursorPos);
        } else {
          setGhostSuggestion('');
        }
      });
    }
  };

  // Handle mobile input via beforeinput event.
  // Mobile keyboards fire this with inputType="insertText" and event.data = typed char.
  // On mobile, onChange does NOT fire after preventDefault(), so we must handle
  // ghost suggestions, spell check, auto-save, and word learning here.
  const handleBeforeInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    if (!isBanglaMode) return;

    const inputEvent = e.nativeEvent as InputEvent;
    // Only intercept single-character text insertion (typing)
    if (inputEvent.inputType !== 'insertText' || !inputEvent.data) return;

    const char = inputEvent.data;
    if (char.length !== 1) return;

    // Only transliterate ASCII characters (phonetic Roman input)
    const code = char.charCodeAt(0);
    const isAsciiPrintable = code >= 32 && code <= 126;
    if (!isAsciiPrintable) return;

    e.preventDefault();
    const result = banglaInputHandler.processCharInput(
      textareaRef,
      currentNote,
      setCurrentNote,
      char
    );

    if (!result) return;

    const { text: newText, cursorPosition: newCursorPos } = result;

    // Push undo snapshot
    pushSnapshot(newText, currentTitle, newCursorPos);

    // Ghost suggestions — use returned newText directly (DOM not updated yet)
    let wordStart = newCursorPos;
    while (wordStart > 0 && !/[\s\.,;!?।]/.test(newText[wordStart - 1])) {
      wordStart--;
    }
    const currentWord = newText.substring(wordStart, newCursorPos);

    if (currentWord && currentWord.length > 0) {
      updateGhostSuggestion(currentWord, getPrevWord(newText, wordStart), newCursorPos);
    } else {
      setGhostSuggestion('');
      setIsAISuggestionActive(false);
    }

    // Word learning at boundaries (space, comma, etc.)
    const lastChar = newText[newCursorPos - 1];
    if (lastChar && /[\s,;]/.test(lastChar)) {
      const beforeBoundary = newText.substring(0, newCursorPos - 1);
      const words = beforeBoundary.split(/[\s\.,;!?।]+/);
      const lastWord = words[words.length - 1];
      if (lastWord && lastWord.length >= 2) {
        adaptiveDictionary.learnWord(lastWord);
      }
      setGhostSuggestion('');
      setIsAISuggestionActive(false);
    }

    // Spell check scheduling
    scheduleSpellCheck(newText, 2000);

    // Auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (newText.trim()) {
        saveCurrentNote();
      }
    }, 2000);
  }, [isBanglaMode, banglaInputHandler, currentNote, currentTitle, setCurrentNote, updateGhostSuggestion, scheduleSpellCheck, saveCurrentNote, pushSnapshot]);

  // Add a direct input handler to catch actual typed characters
  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    if (!isBanglaMode) {
      setGhostSuggestion('');
      return;
    }

    // Clear stale ghost immediately
    setGhostSuggestion('');

    const textarea = e.target as HTMLTextAreaElement;
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;
    
    // Find current word at cursor position
    let start = cursorPos;
    while (start > 0 && !/[\s\.,;!?।]/.test(text[start - 1])) {
      start--;
    }

    const currentWordAtCursor = text.substring(start, cursorPos);

    // Only update if we have a word
    if (currentWordAtCursor && currentWordAtCursor.length > 0) {
      updateGhostSuggestion(currentWordAtCursor, getPrevWord(text, start), cursorPos);
    } else {
      setGhostSuggestion('');
    }
  }, [isBanglaMode, updateGhostSuggestion]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const prevValue = currentNote;
    setCurrentNote(value);

    // Push undo snapshot
    pushSnapshot(value, currentTitle, e.target.selectionStart);

    // Clear stale ghost suggestion immediately — debounced update will set the new one
    setGhostSuggestion('');
    setIsAISuggestionActive(false);
    
    // Always schedule spell check when in Bangla mode (not gated by showSpellingErrors)
    // Auto-invalidation handles immediate error removal; debounce catches new errors
    if (isBanglaMode) {
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

          // Learn bigram: second-to-last word → last word
          const prevWord = words.length >= 2 ? words[words.length - 2] : undefined;
          if (prevWord && prevWord.length >= 2) {
            bigramStore.recordBigram(prevWord, lastWord);
          }
        }
        
        // Clear word suggestion
        setGhostSuggestion('');
        setIsAISuggestionActive(false);

        // Trigger AI suggestion after user types a space and pauses 500ms
        if (lastChar === ' ' && isBanglaMode) {
          if (aiTriggerRef.current) clearTimeout(aiTriggerRef.current);
          aiTriggerRef.current = setTimeout(() => {
            const cursorContext = value.length > 200 ? value.slice(-200) : value;
            requestAISuggestion(cursorContext);
          }, AI_TRIGGER_DELAY_MS);
        }
      } else if (lastChar === '।' || lastChar === '.' || lastChar === '?' || lastChar === '!') {
        // Sentence ended, clear AI suggestion
        setGhostSuggestion('');
        clearAISuggestion();
        setIsAISuggestionActive(false);
      } else {
        // Check for word suggestions on every change
        if (isBanglaMode) {
          const cursorPos = e.target.selectionStart;
          let start = cursorPos;
          while (start > 0 && !/[\s\.,;!?।]/.test(value[start - 1])) {
            start--;
          }
          const word = value.substring(start, cursorPos);
          if (word && word.length > 0) {
            // Show word suggestions (with bigram context)
            updateGhostSuggestion(word, getPrevWord(value, start), cursorPos);
          }
        }
      }
    } else {
      // Text was deleted, clear suggestions
      setGhostSuggestion('');
      clearAISuggestion();
      setIsAISuggestionActive(false);
    }
  }, [currentNote, currentTitle, scheduleSpellCheck, saveCurrentNote, isBanglaMode, setGhostSuggestion, updateGhostSuggestion, requestAISuggestion, clearAISuggestion, pushSnapshot]);

  return (
    <div className="app-container">
      <Onboarding />
      {/* Top Navigation Bar */}
      <header className="topbar">
        <div className="topbar-left">
          <button
            className="btn-hamburger"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="topbar-title">
            <svg className="topbar-logo-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              <path d="M9 10h6" />
              <path d="M9 14h4" />
            </svg>
            কাগজ
          </h1>
        </div>

        <div className="topbar-controls">
          {/* Keyboard Shortcuts Button */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn-shortcuts"
              title="কীবোর্ড শর্টকাট (Ctrl+/)"
              aria-label="কীবোর্ড শর্টকাট"
              onClick={() => setShowShortcuts((prev) => !prev)}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <rect x="2" y="6" width="20" height="13" rx="2" />
                <path strokeLinecap="round" d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8M6 14h.01M18 14h.01" />
              </svg>
              <span className="btn-shortcuts-label">Ctrl /</span>
            </button>
            <KeyboardShortcutsPanel
              isOpen={showShortcuts}
              onClose={() => setShowShortcuts(false)}
            />
          </div>

          {/* Language Toggle — Segmented Pill */}
          <button
            onClick={toggleLanguageMode}
            className="lang-toggle"
            aria-label={isBanglaMode ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
            title="Toggle language (Ctrl+Shift+B)"
          >
            <span className="lang-toggle-bg" style={{ transform: isBanglaMode ? 'translateX(0)' : 'translateX(100%)' }} />
            <span className={`lang-toggle-option ${isBanglaMode ? 'active' : ''}`}>বা</span>
            <span className={`lang-toggle-option ${!isBanglaMode ? 'active' : ''}`}>En</span>
          </button>

          {/* Theme Toggle — Icon Button */}
          <button
            onClick={toggleTheme}
            className={`theme-toggle ${isClient && isDarkMode ? 'dark' : 'light'}`}
            aria-label={isClient && isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title="Toggle theme (Ctrl+Shift+T)"
            disabled={!isClient}
          >
            <span className="theme-toggle-icon-wrap">
              {/* Sun */}
              <svg className="theme-toggle-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
              {/* Moon */}
              <svg className="theme-toggle-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Sidebar Backdrop (mobile) */}
        {sidebarOpen && (
          <div className="sidebar-backdrop" onClick={closeSidebar} />
        )}

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
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

          <div className="sidebar-search">
            <div className="search-input-wrapper">
              <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="নোট খুঁজুন..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="sidebar-content">
            <h2 className="sidebar-title">সকল নোট</h2>
            <NoteList
              notes={notes}
              selectedNoteIndex={selectedNoteIndex}
              searchQuery={searchQuery}
              onSelect={(index) => {
                selectNote(index);
                closeSidebar();
              }}
              onDelete={deleteNote}
            />
          </div>

          <div className="sidebar-footer">
            <span className="sidebar-credit-line">সহজে বাংলা লিখুন &hearts;</span>
            <span className="sidebar-credit-line">
              <a
                href="https://github.com/tarex"
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-credit-link"
              >
                tarex
              </a>
            </span>
          </div>
        </aside>

        {/* Editor Container */}
        <div className="editor-container">
          {/* Editor Main Area */}
          <div className="editor-main" style={{ position: 'relative' }}>
            {/* Note Title Input */}
            <input
              ref={titleInputRef}
              type="text"
              placeholder="শিরোনাম..."
              className="note-title-input"
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              onKeyDown={(e) => {
                if (isBanglaMode) {
                  banglaInputHandler.processInputKeyPress(
                    titleInputRef as unknown as React.RefObject<HTMLTextAreaElement>,
                    currentTitle,
                    setCurrentTitle,
                    e as unknown as React.KeyboardEvent<HTMLTextAreaElement>
                  );
                }
              }}
              onBeforeInput={(e) => {
                if (!isBanglaMode) return;
                const inputEvent = e.nativeEvent as InputEvent;
                if (inputEvent.inputType !== 'insertText' || !inputEvent.data) return;
                const char = inputEvent.data;
                if (char.length !== 1) return;
                const code = char.charCodeAt(0);
                if (code < 32 || code > 126) return;
                e.preventDefault();
                banglaInputHandler.processCharInput(
                  titleInputRef as unknown as React.RefObject<HTMLTextAreaElement>,
                  currentTitle,
                  setCurrentTitle,
                  char
                );
              }}
            />
            <div className="title-divider"><hr /></div>
            <div className="editor-wrapper">
              
              <NoteEditor
                value={currentNote}
                onChange={handleChange}
                onKeyDown={handleKeyPress}
                onBeforeInput={handleBeforeInput}
                onInput={handleInput}
                textareaRef={textareaRef}
                fontSize={fontSize}
              />
              {ghostSuggestion && (
                <GhostText
                  currentText={currentNote}
                  suggestion={ghostSuggestion}
                  cursorPos={ghostCursorPos}
                  fontSize={fontSize}
                  textareaRef={textareaRef}
                  isAISuggestion={isAISuggestionActive}
                  onAccept={acceptGhostSuggestion}
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
              {/* Word Suggestion Popup — shows when user highlights a word */}
              <WordSuggestionPopup
                textareaRef={textareaRef}
                isBanglaMode={isBanglaMode}
                getSuggestions={getWordSuggestions}
                onReplace={handleWordReplace}
              />
            </div>
          </div>

          {/* Floating Format Toolbar */}
          <Toolbar
            onFormatBold={formatBold}
            onFormatItalic={formatItalic}
            onFormatUnderline={formatUnderline}
            onFormatStrikethrough={formatStrikethrough}
            onFormatCode={formatCode}
            onFormatHighlight={formatHighlight}
            onInsertBullet={insertBullet}
            onInsertNumberedList={insertNumberedList}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo()}
            canRedo={canRedo()}
            onPrint={handlePrint}
            isBanglaMode={isBanglaMode}
            fontSize={fontSize}
            onFontSizeChange={(newSize: number) => {
              setFontSize(newSize);
              localStorage.setItem(FONT_SIZE_KEY, String(newSize));
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default NoteComponent;