import { createSpellChecker, isCommonMistake, phoneticDistance } from 'kagoj-input';
import type { SpellingError } from 'kagoj-input';
import { adaptiveDictionary } from './adaptive-dictionary';
import { bigramStore } from './bigram-store';

// Re-export types and utilities
export type { SpellingError };
export { isCommonMistake, phoneticDistance };

// Create spell checker bound to the app's singleton instances
const spellChecker = createSpellChecker(adaptiveDictionary, bigramStore);

export const checkSpelling = spellChecker.checkSpelling;
export const getSpellingSuggestions = spellChecker.getSpellingSuggestions;
