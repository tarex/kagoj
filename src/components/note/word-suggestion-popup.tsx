import React, { useState, useEffect, useRef, useCallback } from 'react';

interface WordSuggestionPopupProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  isBanglaMode: boolean;
  getSuggestions: (word: string) => string[];
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

  const checkSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || !isBanglaMode) {
      setSelectedWord('');
      setSuggestions([]);
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

    const wordSuggestions = getSuggestions(word);
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
    const x = textareaRect.left + (markerRect.left - mirrorRect.left) + markerRect.width / 2;
    const y = textareaRect.top + (markerRect.top - mirrorRect.top) + markerRect.height + 6;

    document.body.removeChild(mirror);

    setPosition({ x, y });
  }, [textareaRef, isBanglaMode, getSuggestions]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleSelectionTrigger = () => {
      // Small delay to let selection settle
      setTimeout(checkSelection, 50);
    };

    // Also handle keyboard selection (shift+arrows)
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey) {
        setTimeout(checkSelection, 50);
      }
    };

    // mouseup for desktop, selectionchange for mobile (long-press select)
    textarea.addEventListener('mouseup', handleSelectionTrigger);
    textarea.addEventListener('keyup', handleKeyUp);
    document.addEventListener('selectionchange', handleSelectionTrigger);

    return () => {
      textarea.removeEventListener('mouseup', handleSelectionTrigger);
      textarea.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('selectionchange', handleSelectionTrigger);
    };
  }, [textareaRef, checkSelection]);

  // Close on click/touch outside
  useEffect(() => {
    if (!selectedWord) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setSelectedWord('');
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
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
    >
      <div className="word-suggestion-header">
        পরিবর্তন করুন
      </div>
      <div className="word-suggestion-list">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            className="word-suggestion-item"
            onClick={() => {
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
