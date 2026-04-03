'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { NoteList } from './note-list';
import { NoteEditor } from './note-editor';
import { GhostText } from './ghost-text';
import { SpellingOverlay } from './spelling-overlay';
import { WordSuggestionPopup } from './word-suggestion-popup';
import { Toolbar } from './toolbar';
import { SharePreviewModal } from './share-preview-modal';
import { KeyboardShortcutsPanel } from './keyboard-shortcuts-panel';
import { Onboarding } from './onboarding';
import { useNotes } from './use-notes';
import { useShareImage } from '../../hooks/useShareImage';
import { useSpellCheck } from '@/hooks/useSpellCheck';
import { useDebounce } from '@/hooks/useDebounce';
import { useAISuggestion, AI_TRIGGER_DELAY_MS } from '@/hooks/useAISuggestion';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { BanglaInputHandler } from '@/lib/bangla-input-handler';
import { adaptiveDictionary } from '@/lib/adaptive-dictionary';
import { bigramStore } from '@/lib/bigram-store';
import { banglaCollocations } from '@/lib/bangla-collocations';
import { comprehensiveBanglaWords } from '@/lib/bangla-words-comprehensive';

const FONT_SIZE_KEY = 'noteFontSize';
const DEFAULT_FONT_SIZE = 24;
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
  // Track whether the user already accepted a suggestion, so late-arriving AI doesn't overwrite
  const suggestionAcceptedRef = useRef<boolean>(false);
  // Refs to avoid recreating handleChange on every keystroke
  const currentNoteRef = useRef(currentNote);
  currentNoteRef.current = currentNote;
  const currentTitleRef = useRef(currentTitle);
  currentTitleRef.current = currentTitle;
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null!);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveCurrentNoteRef = useRef(saveCurrentNote);
  saveCurrentNoteRef.current = saveCurrentNote;
  const aiTriggerRef = useRef<NodeJS.Timeout | null>(null);

  // Android composition input tracking
  const handledByBeforeInputRef = useRef<boolean>(false);
  const isComposingRef = useRef<boolean>(false);
  const handledByInputFallbackRef = useRef<boolean>(false);


  const { aiSuggestion, isLoadingAI: _isLoadingAI, requestAISuggestion, clearAISuggestion, clearSuggestionCache } = useAISuggestion(isBanglaMode);
  
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

  const { captureRef, captureAndDownload, captureAndCopy, isCapturing, copyStatus } = useShareImage();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareContent, setShareContent] = useState('');

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

  // Scroll textarea so the cursor line is visible
  const scrollCursorIntoView = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    requestAnimationFrame(() => {
      const { selectionStart, value } = textarea;
      const textBeforeCursor = value.substring(0, selectionStart);
      const lineNumber = textBeforeCursor.split('\n').length;
      const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || fontSize * 1.9;
      const cursorY = lineNumber * lineHeight;
      const visibleBottom = textarea.scrollTop + textarea.clientHeight;
      if (cursorY > visibleBottom - lineHeight) {
        textarea.scrollTop = cursorY - textarea.clientHeight + lineHeight * 2;
      }
    });
  }, [fontSize]);

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
  const insertNumberedList = useCallback(() => insertFormatting('১। ', ''), []);

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

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleCopyToClipboard = useCallback(async () => {
    const text = currentNote ?? '';
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }, [currentNote]);

  const openShareModal = useCallback(() => {
    // Read selection synchronously BEFORE any React state update
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const hasSelection = start !== end;

    const textToCapture = hasSelection
      ? currentNote.substring(start, end)
      : currentNote;

    setShareContent(textToCapture);
    setShareModalOpen(true);
  }, [currentNote]);

  const handleShareDownload = useCallback(() => {
    captureAndDownload(currentTitle).catch(console.error);
  }, [currentTitle, captureAndDownload]);

  const handleShareCopy = useCallback(() => {
    captureAndCopy(currentTitle).catch(console.error);
  }, [currentTitle, captureAndCopy]);

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
    adaptiveDictionary.initializeOnClient(comprehensiveBanglaWords);
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

  // Clear spell-check errors, AI cache, and reset undo history when switching notes
  useEffect(() => {
    clearSpellCheck();
    clearSuggestionCache();
    resetHistory(currentNote, currentTitle, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset on note switch, not on every text change
  }, [selectedNoteIndex, clearSpellCheck, clearSuggestionCache, resetHistory]);

  // Unified function to clear all suggestion state (ghost, AI, timers)
  const clearAllSuggestions = useCallback(() => {
    setGhostSuggestion('');
    setIsAISuggestionActive(false);
    clearAISuggestion();
    if (aiTriggerRef.current) {
      clearTimeout(aiTriggerRef.current);
      aiTriggerRef.current = null;
    }
  }, [clearAISuggestion]);

  // Sync AI suggestion into ghost suggestion state.
  // Skip if the user already accepted a suggestion (prevents late AI from clobbering accepted text).
  useEffect(() => {
    if (aiSuggestion && !suggestionAcceptedRef.current) {
      setGhostSuggestion(aiSuggestion);
      setIsAISuggestionActive(true);
    }
  }, [aiSuggestion]);


  const updateGhostSuggestionInternal = useCallback((word: string, prevWord?: string, cursorPos?: number) => {
    if (word && word.length >= 1 && isBanglaMode) {
      // Get trie-based suggestions (unigram)
      const trieSuggestions = adaptiveDictionary.getSuggestions(word, 10);

      let bestMatch: string | undefined;

      if (prevWord) {
        // 1. Check user-learned bigrams first (strongest signal)
        const bigramHits = bigramStore.getSuggestionsWithPrefix(prevWord, word, 5);
        if (bigramHits.length > 0) {
          bestMatch = bigramHits[0];
        }

        // 2. If no user bigrams, check pre-seeded collocations against trie suggestions
        if (!bestMatch && trieSuggestions.length > 0) {
          const collocationHits = bigramStore.getSuggestionsWithPrefix(prevWord, word, 5);
          // Also check if any trie suggestion forms a known collocation
          const collocationSet = new Set(collocationHits);
          const contextualMatch = trieSuggestions.find(s => collocationSet.has(s));
          if (contextualMatch) {
            bestMatch = contextualMatch;
          }
        }

        // 3. Re-rank trie suggestions: prefer those that are known next-words for prevWord
        if (!bestMatch && trieSuggestions.length > 1) {
          const nextWords = bigramStore.getSuggestions(prevWord, 20);
          const nextWordSet = new Set(nextWords);
          const contextRanked = trieSuggestions.find(s => nextWordSet.has(s));
          if (contextRanked) {
            bestMatch = contextRanked;
          }
        }
      }

      // Fall back to plain trie if no contextual match
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

    suggestionAcceptedRef.current = true;

    if (!isAISuggestionActive) {
      // Dictionary suggestion: learn the completed word
      let start = cursorPos;
      while (start > 0 && !/[\s\.,;!?।]/.test(text[start - 1])) {
        start--;
      }
      const currentWord = text.substring(start, cursorPos);
      const fullWord = currentWord + ghostSuggestion;
      if (adaptiveDictionary.isKnownWord(fullWord)) {
        adaptiveDictionary.learnWord(fullWord);
      }
    }

    clearAISuggestion();
    setGhostSuggestion('');
    setIsAISuggestionActive(false);

    const newText = text.substring(0, cursorPos) + ghostSuggestion + text.substring(cursorPos);
    const newPos = cursorPos + ghostSuggestion.length;
    setCurrentNote(newText);
    pushSnapshot(newText, currentTitleRef.current, newPos);
    saveCurrentNoteRef.current();

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = newPos;
      textarea.focus();
    }, 0);

    return true;
  }, [ghostSuggestion, isAISuggestionActive, clearAISuggestion, setCurrentNote, pushSnapshot]);

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Skip during active IME composition to prevent double-processing on Android
    if (isComposingRef.current) return;
    // Handle Ctrl+Tab to toggle language mode
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      toggleLanguageMode();
      return;
    }

    // Handle Tab key for accepting word suggestion
    if (e.key === 'Tab' && ghostSuggestion) {
      e.preventDefault();
      acceptGhostSuggestion();
      return;
    }
    
    // Removed automatic spell checking on Enter key
    
    // Handle Escape key to dismiss ghost suggestion
    if (e.key === 'Escape' && ghostSuggestion) {
      clearAllSuggestions();
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

    // Clear ghost on cursor movement -- suggestion is position-dependent
    if (skipKeys.includes(e.key)) {
      clearAllSuggestions();
      return;
    }

    // Let browser handle Backspace/Delete natively when text is selected
    const hasSelection = textareaRef.current &&
      textareaRef.current.selectionStart !== textareaRef.current.selectionEnd;
    if (hasSelection && (e.key === 'Backspace' || e.key === 'Delete')) {
      clearAllSuggestions();
      return;
    }
    if (isBanglaMode && !skipKeys.includes(e.key)) {
      banglaInputHandler.processInputKeyPress(
        textareaRef,
        currentNote,
        setCurrentNote,
        e
      );
      scrollCursorIntoView();

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

    handledByBeforeInputRef.current = false;

    const inputEvent = e.nativeEvent as InputEvent;
    // Intercept text insertion -- both regular and composition (Android keyboards)
    const isTextInsert = inputEvent.inputType === 'insertText' ||
                         inputEvent.inputType === 'insertCompositionText';
    if (!isTextInsert || !inputEvent.data) return;

    const char = inputEvent.data;
    if (char.length !== 1) return;

    // Only transliterate ASCII characters (phonetic Roman input)
    const code = char.charCodeAt(0);
    const isAsciiPrintable = code >= 32 && code <= 126;
    if (!isAsciiPrintable) return;

    e.preventDefault();
    handledByBeforeInputRef.current = true;
    const result = banglaInputHandler.processCharInput(
      textareaRef,
      currentNote,
      setCurrentNote,
      char
    );

    if (!result) return;
    scrollCursorIntoView();

    const { text: newText, cursorPosition: newCursorPos } = result;

    // Push undo snapshot
    pushSnapshot(newText, currentTitle, newCursorPos);

    // Ghost suggestions — use returned newText directly (DOM not updated yet)
    let wordStart = newCursorPos;
    while (wordStart > 0 && !/[\s\.,;!?।]/.test(newText[wordStart - 1])) {
      wordStart--;
    }
    const currentWord = newText.substring(wordStart, newCursorPos);

    suggestionAcceptedRef.current = false;
    if (currentWord && currentWord.length > 0) {
      updateGhostSuggestion(currentWord, getPrevWord(newText, wordStart), newCursorPos);
    } else {
      clearAllSuggestions();
    }

    // Word learning at boundaries (space, comma, etc.)
    const lastChar = newText[newCursorPos - 1];
    if (lastChar && /[\s,;]/.test(lastChar)) {
      const beforeBoundary = newText.substring(0, newCursorPos - 1);
      const words = beforeBoundary.split(/[\s\.,;!?।]+/);
      const lastWord = words[words.length - 1];
      if (lastWord && lastWord.length >= 2 && adaptiveDictionary.isKnownWord(lastWord)) {
        adaptiveDictionary.learnWord(lastWord);
      }
      clearAllSuggestions();
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
  }, [isBanglaMode, banglaInputHandler, currentNote, currentTitle, setCurrentNote, updateGhostSuggestion, clearAllSuggestions, scheduleSpellCheck, saveCurrentNote, pushSnapshot]);

  // Input handler: acts as fallback transliterator for Android composition input.
  // On desktop/iOS, beforeinput handles everything and this just updates ghost suggestions.
  // On Android keyboards using composition, beforeinput may fail to preventDefault(),
  // so this detects untransliterated ASCII and corrects it after insertion.
  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    if (!isBanglaMode) {
      clearAllSuggestions();
      handledByBeforeInputRef.current = false;
      return;
    }

    // If beforeinput already handled this keystroke, reset flag and skip
    if (handledByBeforeInputRef.current) {
      handledByBeforeInputRef.current = false;
      return;
    }

    // FALLBACK: beforeinput did NOT handle this input.
    // This happens on Android when composition events bypass our filter
    // or when preventDefault() on beforeinput was ignored by the browser.
    // The ASCII character is already in the DOM -- find and transliterate it.

    const textarea = e.target as HTMLTextAreaElement;
    const currentDomValue = textarea.value;
    const cursorPos = textarea.selectionStart;
    const prevValue = currentNoteRef.current;

    // Not a character insertion (deletion or no change) -- just update ghost
    if (currentDomValue.length <= prevValue.length) {
      clearAllSuggestions();
      return;
    }

    // Extract the newly inserted text
    const insertionLength = currentDomValue.length - prevValue.length;
    const insertionStart = cursorPos - insertionLength;

    if (insertionStart < 0) return;

    const insertedText = currentDomValue.substring(insertionStart, cursorPos);

    // Only transliterate ASCII input (phonetic Roman characters)
    // If it's already Bangla or non-ASCII, just update ghost suggestions
    if (!/^[\x20-\x7E]+$/.test(insertedText)) {
      let start = cursorPos;
      while (start > 0 && !/[\s\.,;!?।]/.test(currentDomValue[start - 1])) {
        start--;
      }
      const currentWordAtCursor = currentDomValue.substring(start, cursorPos);
      if (currentWordAtCursor && currentWordAtCursor.length > 0) {
        updateGhostSuggestion(currentWordAtCursor, getPrevWord(currentDomValue, start), cursorPos);
      }
      return;
    }

    // Remove the ASCII from the DOM value, then transliterate character-by-character
    const beforeInsertion = currentDomValue.substring(0, insertionStart);
    const afterInsertion = currentDomValue.substring(cursorPos);

    let transliteratedBefore = beforeInsertion;
    for (const char of insertedText) {
      transliteratedBefore = banglaInputHandler.transliterateChar(transliteratedBefore, char);
    }

    const newText = transliteratedBefore + afterInsertion;
    const newCursorPos = transliteratedBefore.length;

    setCurrentNote(newText);
    handledByInputFallbackRef.current = true;

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newCursorPos;
        textareaRef.current.selectionEnd = newCursorPos;
      }
    });

    pushSnapshot(newText, currentTitleRef.current, newCursorPos);

    // Ghost suggestions
    let wordStart = newCursorPos;
    while (wordStart > 0 && !/[\s\.,;!?।]/.test(newText[wordStart - 1])) {
      wordStart--;
    }
    const currentWord = newText.substring(wordStart, newCursorPos);

    suggestionAcceptedRef.current = false;
    if (currentWord && currentWord.length > 0) {
      updateGhostSuggestion(currentWord, getPrevWord(newText, wordStart), newCursorPos);
    } else {
      clearAllSuggestions();
    }

    // Word learning at boundaries
    const lastChar = newText[newCursorPos - 1];
    if (lastChar && /[\s,;]/.test(lastChar)) {
      const beforeBoundary = newText.substring(0, newCursorPos - 1);
      const words = beforeBoundary.split(/[\s\.,;!?।]+/);
      const lastWord = words[words.length - 1];
      if (lastWord && lastWord.length >= 2 && adaptiveDictionary.isKnownWord(lastWord)) {
        adaptiveDictionary.learnWord(lastWord);
      }
      clearAllSuggestions();
    }

    scheduleSpellCheck(newText, 2000);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (newText.trim()) {
        saveCurrentNote();
      }
    }, 2000);
  }, [isBanglaMode, banglaInputHandler, setCurrentNote, updateGhostSuggestion, clearAllSuggestions, scheduleSpellCheck, saveCurrentNote, pushSnapshot]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Skip if the handleInput fallback already processed this input (Android composition)
    if (handledByInputFallbackRef.current) {
      handledByInputFallbackRef.current = false;
      return;
    }

    const value = e.target.value;
    const prevValue = currentNoteRef.current;
    setCurrentNote(value);
    scrollCursorIntoView();

    // Push undo snapshot
    pushSnapshot(value, currentTitleRef.current, e.target.selectionStart);

    // Clear stale ghost suggestion immediately -- debounced update will set the new one
    clearAllSuggestions();
    suggestionAcceptedRef.current = false;
    
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
        saveCurrentNoteRef.current();
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
          // Only boost frequency for words already in the dictionary.
          // Unknown words are NOT auto-learned — this prevents misspellings
          // from entering the dictionary before spell check can flag them.
          const isBangla = /[\u0980-\u09FF]/.test(lastWord);
          if (isBangla && adaptiveDictionary.isKnownWord(lastWord)) {
            adaptiveDictionary.learnWord(lastWord);
          }

          // Learn bigram: second-to-last word → last word
          const prevWord = words.length >= 2 ? words[words.length - 2] : undefined;
          if (prevWord && prevWord.length >= 2) {
            bigramStore.recordBigram(prevWord, lastWord);
          }
        }
        
        // Immediate next-word prediction from bigrams (no AI delay)
        if (lastChar === ' ' && isBanglaMode && lastWord && lastWord.length >= 2) {
          const nextWordPredictions = bigramStore.getSuggestions(lastWord, 1);
          if (nextWordPredictions.length > 0) {
            setGhostSuggestion(nextWordPredictions[0]);
            setGhostCursorPos(value.length);
            setIsAISuggestionActive(true); // treat as full-word insertion like AI
          }
        }

        // Trigger AI suggestion after user types a space and pauses 500ms
        // (will override bigram prediction if AI returns something better)
        if (lastChar === ' ' && isBanglaMode) {
          if (aiTriggerRef.current) clearTimeout(aiTriggerRef.current);
          aiTriggerRef.current = setTimeout(() => {
            const cursorContext = value.length > 500 ? value.slice(-500) : value;
            requestAISuggestion(cursorContext, value, currentTitleRef.current);
          }, AI_TRIGGER_DELAY_MS);
        }
      } else if (lastChar === '।' || lastChar === '.' || lastChar === '?' || lastChar === '!') {
        // Sentence ended, clear all suggestions
        clearAllSuggestions();
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
      clearAllSuggestions();
    }
  }, [scheduleSpellCheck, saveCurrentNote, isBanglaMode, updateGhostSuggestion, requestAISuggestion, clearAllSuggestions, pushSnapshot, setCurrentNote, scrollCursorIntoView]);

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

          {/* GitHub */}
          <a
            href="https://github.com/tarex/kagoj"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-github"
            aria-label="GitHub"
            title="GitHub"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>
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
                ref={searchInputRef}
                type="text"
                placeholder="নোট খুঁজুন..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (isBanglaMode) {
                    banglaInputHandler.processInputKeyPress(
                      searchInputRef as unknown as React.RefObject<HTMLTextAreaElement>,
                      searchQuery,
                      setSearchQuery,
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
                    searchInputRef as unknown as React.RefObject<HTMLTextAreaElement>,
                    searchQuery,
                    setSearchQuery,
                    char
                  );
                }}
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
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                textareaRef={textareaRef}
                fontSize={fontSize}
              />
              {/* Print-only div: textarea is a replaced element that can't split
                  across pages, so we mirror content in a div for print layout */}
              <div className="print-content" aria-hidden="true" suppressHydrationWarning>{currentNote}</div>
              {isClient && shareModalOpen && (
                <SharePreviewModal
                  isOpen={shareModalOpen}
                  content={shareContent || currentNote}
                  title={currentTitle}
                  fontSize={fontSize}
                  captureRef={captureRef}
                  onClose={() => setShareModalOpen(false)}
                  onDownload={handleShareDownload}
                  onCopy={handleShareCopy}
                  isCapturing={isCapturing}
                  copyStatus={copyStatus}
                />
              )}
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
            onPrint={handlePrint}
            onShareImage={openShareModal}
            onCopyToClipboard={handleCopyToClipboard}
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