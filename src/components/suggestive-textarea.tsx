'use client';

import type React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';

interface SuggestiveTextAreaProps {
  suggestions: string[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  style: React.CSSProperties;
  rows: number;
  placeholder: string;
}

export default function SuggestiveTextArea({
  suggestions,
  value,
  onChange,
  onKeyDown,
  textareaRef,
  style,
  rows,
  placeholder,
}: SuggestiveTextAreaProps) {
  const [suggestion, setSuggestion] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateSuggestion = useCallback(() => {
    const words = value.slice(0, cursorPosition).split(' ');
    const currentWord = words[words.length - 1]?.toLowerCase() || '';

    const matchingSuggestion = suggestions.find(
      (s) =>
        s.toLowerCase().startsWith(currentWord) &&
        s.toLowerCase() !== currentWord
    );

    setSuggestion(
      matchingSuggestion ? matchingSuggestion.slice(currentWord.length) : ''
    );
  }, [value, cursorPosition, suggestions]);

  useEffect(() => {
    if (isTyping) {
      updateSuggestion();
    } else {
      setSuggestion('');
    }
  }, [isTyping, updateSuggestion]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
    setCursorPosition(e.target.selectionStart);
    setIsTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      const newValue =
        value.slice(0, cursorPosition) +
        suggestion +
        value.slice(cursorPosition);
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;

      nativeInputValueSetter?.call(textareaRef.current, newValue);

      const ev = new Event('input', { bubbles: true });
      textareaRef.current?.dispatchEvent(ev);

      const newCursorPosition = cursorPosition + suggestion.length;
      setCursorPosition(newCursorPosition);
      textareaRef.current?.setSelectionRange(
        newCursorPosition,
        newCursorPosition
      );
      setIsTyping(false);
    } else if (e.key === 'Backspace') {
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    onKeyDown(e);
  };

  const handleClick = () => {
    setCursorPosition(textareaRef.current?.selectionStart || 0);
    setIsTyping(false);
  };

  return (
    <div className="relative w-full font-mono">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        onClick={handleClick}
        className="note-textarea"
        style={style}
        rows={rows}
        placeholder={placeholder}
        aria-label="Text input with word suggestions"
      />
      {isTyping && suggestion && (
        <div
          className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none p-2 text-gray-400"
          aria-hidden="true"
        >
          <span className="invisible">{value.slice(0, cursorPosition)}</span>
          <span>{suggestion}</span>
        </div>
      )}
    </div>
  );
}
