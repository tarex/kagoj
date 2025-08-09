import React, { useState, useEffect, useRef } from 'react';

interface AutocompleteProps {
  suggestions: string[];
  currentWord: string;
  position: { top: number; left: number };
  onSelect: (suggestion: string) => void;
  visible: boolean;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  suggestions,
  currentWord,
  position,
  onSelect,
  visible,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          onSelect(suggestions[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onSelect('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, suggestions, selectedIndex, onSelect]);

  if (!visible || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="autocomplete-container"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className={`autocomplete-item ${index === selectedIndex ? 'selected' : ''}`}
          onMouseEnter={() => setSelectedIndex(index)}
          onClick={() => onSelect(suggestion)}
        >
          <span className="autocomplete-match">
            {currentWord}
          </span>
          <span className="autocomplete-completion">
            {suggestion.slice(currentWord.length)}
          </span>
        </div>
      ))}
      <div className="autocomplete-hint">
        Press <kbd>Tab</kbd> to accept • <kbd>↑↓</kbd> to navigate • <kbd>Esc</kbd> to dismiss
      </div>
    </div>
  );
};