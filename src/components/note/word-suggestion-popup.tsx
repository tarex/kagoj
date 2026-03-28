import React, { useState, useEffect, useRef, useCallback } from 'react';

interface WordSuggestionPopupProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  isBanglaMode: boolean;
  getSuggestions: (word: string, prevWord?: string) => string[];
  onReplace: (start: number, end: number, replacement: string) => void;
}

export const WordSuggestionPopup: React.FC<WordSuggestionPopupProps> = ({
  textareaRef,
  isBanglaMode,
  getSuggestions,
  onReplace,
}) => {
  const [selectedWord, setSelectedWord] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });
  const popupRef = useRef<HTMLDivElement>(null);
  const selectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || !isBanglaMode) {
      setSelectedWord('');
      setSuggestions([]);
      return;
    }

    // Only check if textarea is focused
    if (document.activeElement !== textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) {
      setSelectedWord('');
      setSuggestions([]);
      return;
    }

    const word = textarea.value.substring(start, end).trim();

    // Only show for single Bangla words (no spaces)
    const isSingleBanglaWord = /^[\u0980-\u09FF\u09BE-\u09CC\u09CD\u09D7]+$/.test(word);
    if (!isSingleBanglaWord || word.length < 2) {
      setSelectedWord('');
      setSuggestions([]);
      return;
    }

    // Extract previous word for context-aware suggestions
    const textBefore = textarea.value.substring(0, start);
    const prevWords = textBefore.split(/[\s\.,;!?।]+/).filter(w => w.length >= 2);
    const prevWord = prevWords.length > 0 ? prevWords[prevWords.length - 1] : undefined;

    const wordSuggestions = getSuggestions(word, prevWord);
    // Filter out the word itself
    const filtered = wordSuggestions.filter(s => s !== word);

    if (filtered.length === 0) {
      setSelectedWord('');
      setSuggestions([]);
      return;
    }

    setSelectedWord(word);
    setSuggestions(filtered);
    setSelectionRange({ start, end });

    // Measure exact position using a mirror div
    const computedStyle = window.getComputedStyle(textarea);
    const mirror = document.createElement('div');
    const mirrorStyles: Record<string, string> = {
      position: 'absolute',
      visibility: 'hidden',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      overflow: 'hidden',
      width: `${textarea.clientWidth}px`,
      height: `${textarea.clientHeight}px`,
      fontFamily: computedStyle.fontFamily,
      fontSize: computedStyle.fontSize,
      fontWeight: computedStyle.fontWeight,
      lineHeight: computedStyle.lineHeight,
      letterSpacing: computedStyle.letterSpacing,
      padding: computedStyle.padding,
      border: computedStyle.border,
      boxSizing: computedStyle.boxSizing,
    };
    Object.assign(mirror.style, mirrorStyles);

    // Text before selection + a marker span
    const textBeforeSelection = textarea.value.substring(0, start);
    const selectedText = textarea.value.substring(start, end);
    const beforeNode = document.createTextNode(textBeforeSelection);
    const marker = document.createElement('span');
    marker.textContent = selectedText || '\u200b';
    mirror.appendChild(beforeNode);
    mirror.appendChild(marker);

    document.body.appendChild(mirror);
    mirror.scrollTop = textarea.scrollTop;

    const markerRect = marker.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();
    const textareaRect = textarea.getBoundingClientRect();

    // markerRect relative to mirror top (scroll already applied via mirror.scrollTop)
    // Then offset by textarea's viewport position
    let x = textareaRect.left + (markerRect.left - mirrorRect.left) + markerRect.width / 2;
    let y = textareaRect.top + (markerRect.top - mirrorRect.top) + markerRect.height + 6;

    document.body.removeChild(mirror);

    // Clamp to viewport so popup doesn't go off-screen on mobile
    const viewportWidth = window.innerWidth;
    x = Math.max(100, Math.min(x, viewportWidth - 100));

    // If popup would go below visible area, show above the selection
    if (y > window.innerHeight - 120) {
      y = textareaRect.top + (markerRect.top - mirrorRect.top) - 80;
    }

    setPosition({ x, y });
  }, [textareaRef, isBanglaMode, getSuggestions]);

  // Debounced selection check to avoid flicker on mobile
  const debouncedCheckSelection = useCallback(() => {
    if (selectionTimerRef.current) {
      clearTimeout(selectionTimerRef.current);
    }
    selectionTimerRef.current = setTimeout(checkSelection, 150);
  }, [checkSelection]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleMouseUp = () => {
      setTimeout(checkSelection, 50);
    };

    // keyboard selection (shift+arrows)
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey) {
        setTimeout(checkSelection, 50);
      }
    };

    // selectionchange for mobile (long-press select) — debounced
    const handleSelectionChange = () => {
      if (document.activeElement === textarea) {
        debouncedCheckSelection();
      }
    };

    textarea.addEventListener('mouseup', handleMouseUp);
    textarea.addEventListener('keyup', handleKeyUp);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      textarea.removeEventListener('mouseup', handleMouseUp);
      textarea.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (selectionTimerRef.current) {
        clearTimeout(selectionTimerRef.current);
      }
    };
  }, [textareaRef, checkSelection, debouncedCheckSelection]);

  // Close on click/touch outside
  useEffect(() => {
    if (!selectedWord) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setSelectedWord('');
        setSuggestions([]);
      }
    };

    // Use a slight delay to avoid immediately closing on the same touch that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
    }, 200);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [selectedWord]);

  // Close on Escape
  useEffect(() => {
    if (!selectedWord) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedWord('');
        setSuggestions([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedWord]);

  if (!selectedWord || suggestions.length === 0) return null;

  return (
    <div
      ref={popupRef}
      className="word-suggestion-popup"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transform: 'translateX(-50%)',
        zIndex: 1000,
      }}
      onPointerDown={(e) => {
        // Prevent textarea blur when tapping popup on mobile
        e.preventDefault();
      }}
    >
      <div className="word-suggestion-header">
        পরিবর্তন করুন
      </div>
      <div className="word-suggestion-list">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            className="word-suggestion-item"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onReplace(selectionRange.start, selectionRange.end, suggestion);
              setSelectedWord('');
              setSuggestions([]);
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};
