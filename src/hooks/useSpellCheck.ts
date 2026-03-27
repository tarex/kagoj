import { useState, useCallback, useRef } from 'react';
import { adaptiveDictionary } from '@/lib/adaptive-dictionary';
import { checkSpelling as localCheckSpelling, addToCustomDictionary, learnFromText } from '@/lib/local-spell-checker';

interface SpellingError {
  word: string;
  correction: string;
  startIndex: number;
  endIndex: number;
  confidence?: number;
}

/**
 * Compare prevText and newText to find the edit region (first differing index
 * from start and end), then filter and adjust errors accordingly.
 *
 * - Errors whose range overlaps the edit region are removed (will be re-checked).
 * - Errors after the edit region have their positions adjusted by length delta.
 */
function invalidateErrors(
  prevText: string,
  newText: string,
  errors: SpellingError[]
): SpellingError[] {
  if (prevText === newText) return errors;

  // Find first differing char from start
  let editStart = 0;
  const minLen = Math.min(prevText.length, newText.length);
  while (editStart < minLen && prevText[editStart] === newText[editStart]) {
    editStart++;
  }

  // Find first differing char from end (relative to shorter string)
  let prevEnd = prevText.length;
  let newEnd = newText.length;
  while (
    prevEnd > editStart &&
    newEnd > editStart &&
    prevText[prevEnd - 1] === newText[newEnd - 1]
  ) {
    prevEnd--;
    newEnd--;
  }

  // editStart..prevEnd is the range replaced in prevText
  // editStart..newEnd is the inserted range in newText
  const lengthDelta = newText.length - prevText.length;

  return errors.reduce<SpellingError[]>((acc, error) => {
    const overlapStart = Math.max(error.startIndex, editStart);
    const overlapEnd = Math.min(error.endIndex, prevEnd);
    const overlaps = overlapStart < overlapEnd;

    if (overlaps) {
      // Error overlaps with edit region — invalidate it
      return acc;
    }

    if (error.startIndex >= prevEnd) {
      // Error is entirely after the edit region — adjust positions
      acc.push({
        ...error,
        startIndex: error.startIndex + lengthDelta,
        endIndex: error.endIndex + lengthDelta,
      });
    } else {
      // Error is entirely before the edit region — keep as-is
      acc.push(error);
    }
    return acc;
  }, []);
}

/** requestIdleCallback with setTimeout fallback */
const scheduleIdle: (cb: () => void, options?: { timeout: number }) => number =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? (cb, opts) => (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(cb, opts)
    : (cb) => setTimeout(cb, 1) as unknown as number;

const cancelIdle: (id: number) => void =
  typeof window !== 'undefined' && 'cancelIdleCallback' in window
    ? (id) => (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id)
    : (id) => clearTimeout(id);

export const useSpellCheck = (isBanglaMode: boolean) => {
  const [spellingErrors, setSpellingErrors] = useState<SpellingError[]>([]);
  const [isCheckingSpelling, setIsCheckingSpelling] = useState(false);
  const [showSpellingErrors, setShowSpellingErrors] = useState(false);
  const spellCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleCallbackRef = useRef<number | null>(null);
  const prevTextRef = useRef<string>('');

  const checkSpelling = useCallback(async (text: string) => {
    if (process.env.NEXT_PUBLIC_DISABLE_SPELL_CHECK === 'true') {
      return;
    }

    if (!text || text.trim().length < 3 || !isBanglaMode) {
      return;
    }

    // Cancel any pending idle callback before scheduling a new one
    if (idleCallbackRef.current !== null) {
      cancelIdle(idleCallbackRef.current);
      idleCallbackRef.current = null;
    }

    setIsCheckingSpelling(true);
    setSpellingErrors([]); // Clear previous errors

    // Run spell-check in idle time so it never blocks the main thread
    idleCallbackRef.current = scheduleIdle(() => {
      idleCallbackRef.current = null;
      try {
        // Learn from the text to improve adaptive dictionary
        learnFromText(text);

        const errors = localCheckSpelling(text);

        if (errors && errors.length > 0) {
          const highConfidenceErrors = errors.filter(e => !e.confidence || e.confidence >= 50);
          setSpellingErrors(highConfidenceErrors);
          setShowSpellingErrors(highConfidenceErrors.length > 0);
        } else {
          setSpellingErrors([]);
          setShowSpellingErrors(false);
        }
      } catch (error) {
        console.error('Spell check error:', error);
      } finally {
        setIsCheckingSpelling(false);
      }
    }, { timeout: 3000 });
  }, [isBanglaMode]);

  const scheduleSpellCheck = useCallback((text: string, delay: number = 2000) => {
    // Immediately invalidate errors at the edited position
    setSpellingErrors(prev => {
      const updated = invalidateErrors(prevTextRef.current, text, prev);
      if (updated.length === 0 && prev.length > 0) {
        setShowSpellingErrors(false);
      }
      return updated;
    });
    prevTextRef.current = text;

    if (spellCheckTimeoutRef.current) {
      clearTimeout(spellCheckTimeoutRef.current);
    }

    spellCheckTimeoutRef.current = setTimeout(() => {
      if (isBanglaMode && text.trim().length > 3) {
        checkSpelling(text);
      }
    }, delay);
  }, [checkSpelling, isBanglaMode]);

  const handleSpellingCorrection = useCallback((
    error: SpellingError,
    text: string,
    onTextChange: (newText: string) => void
  ) => {
    // Verify that the word at the position is still the error word
    const wordAtPosition = text.substring(error.startIndex, error.endIndex);

    let adjustedError = error;

    if (wordAtPosition !== error.word) {
      // Try to find the word near the expected position
      const searchStart = Math.max(0, error.startIndex - 20);
      const searchEnd = Math.min(text.length, error.endIndex + 20);
      const searchText = text.substring(searchStart, searchEnd);
      const wordIndex = searchText.indexOf(error.word);

      if (wordIndex !== -1) {
        const newStartIndex = searchStart + wordIndex;
        const newEndIndex = newStartIndex + error.word.length;
        adjustedError = { ...error, startIndex: newStartIndex, endIndex: newEndIndex };
      } else {
        console.error('Could not find the word to correct');
        return;
      }
    }

    // Replace the error word with the correction
    const newText = text.substring(0, adjustedError.startIndex) +
                   adjustedError.correction +
                   text.substring(adjustedError.endIndex);

    onTextChange(newText);

    // Update the adaptive dictionary: remove misspelled word, add correct one
    adaptiveDictionary.replaceWord(error.word, error.correction);

    // Calculate the length difference for position adjustment
    const lengthDiff = error.correction.length - error.word.length;

    // Update other error positions that come after this one and remove the corrected error
    setSpellingErrors(prev => {
      const filtered = prev.filter(e =>
        !(e.startIndex === adjustedError.startIndex && e.endIndex === adjustedError.endIndex && e.word === error.word)
      );

      const updated = filtered.map(e => {
        if (e.startIndex > adjustedError.endIndex) {
          return {
            ...e,
            startIndex: e.startIndex + lengthDiff,
            endIndex: e.endIndex + lengthDiff
          };
        }
        return e;
      });

      if (updated.length === 0) {
        setShowSpellingErrors(false);
      }

      return updated;
    });
  }, []);

  const handleIgnoreSpelling = useCallback((error: SpellingError) => {
    // Add the ignored word to dictionaries as a valid word
    adaptiveDictionary.learnWord(error.word);
    addToCustomDictionary(error.word);

    setSpellingErrors(prev => {
      const filtered = prev.filter(e =>
        !(e.startIndex === error.startIndex && e.endIndex === error.endIndex && e.word === error.word)
      );

      if (filtered.length === 0) {
        setShowSpellingErrors(false);
      }

      return filtered;
    });
  }, []);

  const clearSpellCheck = useCallback(() => {
    setSpellingErrors([]);
    setShowSpellingErrors(false);
    if (spellCheckTimeoutRef.current) {
      clearTimeout(spellCheckTimeoutRef.current);
    }
    if (idleCallbackRef.current !== null) {
      cancelIdle(idleCallbackRef.current);
      idleCallbackRef.current = null;
    }
  }, []);

  return {
    spellingErrors,
    isCheckingSpelling,
    showSpellingErrors,
    checkSpelling,
    scheduleSpellCheck,
    handleSpellingCorrection,
    handleIgnoreSpelling,
    clearSpellCheck,
  };
};
