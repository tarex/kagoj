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

export const useSpellCheck = (isBanglaMode: boolean) => {
  const [spellingErrors, setSpellingErrors] = useState<SpellingError[]>([]);
  const [isCheckingSpelling, setIsCheckingSpelling] = useState(false);
  const [showSpellingErrors, setShowSpellingErrors] = useState(false);
  const spellCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkSpelling = useCallback(async (text: string) => {
    // Check if spell checking is disabled via environment variable
    if (process.env.NEXT_PUBLIC_DISABLE_SPELL_CHECK === 'true') {
      console.log('Spell checking is disabled via environment variable');
      return;
    }
    
    if (!text || text.trim().length < 3 || !isBanglaMode) {
      return;
    }
    
    console.log('🔍 Checking spelling locally for entire document');
    setIsCheckingSpelling(true);
    setSpellingErrors([]); // Clear previous errors
    
    try {
      // First, learn from the text to improve adaptive dictionary
      learnFromText(text);
      
      // Use local spell checker instead of AI
      const errors = localCheckSpelling(text);
      
      console.log('✅ Local spell check complete');
      
      if (errors && errors.length > 0) {
        // Filter out low confidence suggestions
        const highConfidenceErrors = errors.filter(e => !e.confidence || e.confidence >= 50);
        console.log(`Spell check found ${highConfidenceErrors.length} errors:`, highConfidenceErrors);
        setSpellingErrors(highConfidenceErrors);
        setShowSpellingErrors(highConfidenceErrors.length > 0);
      } else {
        console.log('No spelling errors found');
        setSpellingErrors([]);
        setShowSpellingErrors(false);
      }
    } catch (error) {
      console.error('❌ Spell check error:', error);
    } finally {
      setIsCheckingSpelling(false);
    }
  }, [isBanglaMode]);

  const scheduleSpellCheck = useCallback((text: string, delay: number = 2000) => {
    if (spellCheckTimeoutRef.current) {
      clearTimeout(spellCheckTimeoutRef.current);
    }
    
    spellCheckTimeoutRef.current = setTimeout(() => {
      if (isBanglaMode && text.trim().length > 3) {
        console.log('Auto re-checking spelling after text change');
        checkSpelling(text);
      }
    }, delay);
  }, [checkSpelling, isBanglaMode]);

  const handleSpellingCorrection = useCallback((
    error: SpellingError,
    text: string,
    onTextChange: (newText: string) => void
  ) => {
    console.log('Attempting to correct:', error);
    
    // Verify that the word at the position is still the error word
    const wordAtPosition = text.substring(error.startIndex, error.endIndex);
    console.log('Word at position:', wordAtPosition);
    console.log('Expected word:', error.word);
    
    let adjustedError = error;
    
    if (wordAtPosition !== error.word) {
      console.warn('Word position has changed. Trying to find the word...');
      
      // Try to find the word near the expected position
      const searchStart = Math.max(0, error.startIndex - 20);
      const searchEnd = Math.min(text.length, error.endIndex + 20);
      const searchText = text.substring(searchStart, searchEnd);
      const wordIndex = searchText.indexOf(error.word);
      
      if (wordIndex !== -1) {
        // Found the word at a different position
        const newStartIndex = searchStart + wordIndex;
        const newEndIndex = newStartIndex + error.word.length;
        console.log('Found word at new position:', newStartIndex, '-', newEndIndex);
        
        // Update error position
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
    
    console.log('Applying correction...');
    onTextChange(newText);
    
    // Update the adaptive dictionary: remove misspelled word, add correct one
    adaptiveDictionary.replaceWord(error.word, error.correction);
    console.log(`Dictionary updated: replaced "${error.word}" with "${error.correction}"`);
    
    // Calculate the length difference for position adjustment
    const lengthDiff = error.correction.length - error.word.length;
    
    // Update other error positions that come after this one and remove the corrected error
    setSpellingErrors(prev => {
      // First remove the corrected error
      const filtered = prev.filter(e => 
        !(e.startIndex === adjustedError.startIndex && e.endIndex === adjustedError.endIndex && e.word === error.word)
      );
      
      // Then adjust positions for errors that come after
      const updated = filtered.map(e => {
        if (e.startIndex > adjustedError.endIndex) {
          // Adjust positions for errors that come after the corrected one
          return {
            ...e,
            startIndex: e.startIndex + lengthDiff,
            endIndex: e.endIndex + lengthDiff
          };
        }
        return e;
      });
      
      console.log(`Corrected "${error.word}" to "${error.correction}". Remaining errors: ${updated.length}`);
      
      // Hide overlay if no more errors
      if (updated.length === 0) {
        setShowSpellingErrors(false);
      }
      
      return updated;
    });
  }, []);

  const handleIgnoreSpelling = useCallback((error: SpellingError) => {
    console.log('Ignoring spelling error:', error);
    
    // Add the "ignored" word to both dictionaries as it might be a valid word
    adaptiveDictionary.learnWord(error.word);
    addToCustomDictionary(error.word);
    console.log(`Added "${error.word}" to dictionary as a valid word`);
    
    // Remove this specific error from the list
    setSpellingErrors(prev => {
      const filtered = prev.filter(e => 
        !(e.startIndex === error.startIndex && e.endIndex === error.endIndex && e.word === error.word)
      );
      console.log(`Removed error. Remaining errors: ${filtered.length}`);
      
      // Hide overlay if no more errors
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