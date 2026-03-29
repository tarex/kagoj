import type { AdaptiveDictionary } from '../dictionary/adaptive-dictionary';
import type { BigramStore } from '../dictionary/bigram-store';
import type { SpellingError } from '../core/types';
import { commonMistakes } from './common-mistakes';
import { phoneticDistance } from './phonetic-distance';

// Common Bangla suffixes for suffix-aware validation (longest first)
const BANGLA_SUFFIXES = [
  // Multi-suffix compounds
  'গুলোর', 'গুলোকে', 'গুলোতে', 'দেরকে', 'দেরই',
  // Primary suffixes
  'গুলো', 'গুলি', 'দের', 'তে', 'কে', 'রা', 'ের', 'তা', 'নো',
  'তেই', 'তেও', 'কেই', 'কেও', 'রাই', 'রাও', 'দেরও',
  // Verb suffixes
  'ছি', 'ছে', 'ছো', 'ছেন', 'লাম', 'লে', 'লেন', 'তাম', 'তেন',
  'ছিল', 'ছিলে', 'ছিলাম', 'ছিলেন',
  // Emphasis / case
  'ই', 'ও', 'ও',
  // Short suffixes last
  'র', 'ে', 'য়', 'তি', 'নি',
];

// Normalize Unicode so visually identical Bangla strings compare equal
function normalizeUnicode(s: string): string {
  return s.normalize('NFC');
}

/** Create a spell checker bound to a dictionary and bigram store */
export function createSpellChecker(dictionary: AdaptiveDictionary, bigrams: BigramStore) {
  function checkSpelling(text: string): SpellingError[] {
    const errors: SpellingError[] = [];

    const wordRegex = /[\u0980-\u09FF]+/g;
    let match;

    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + word.length;

      if (word.length <= 2) {
        continue;
      }

      const normalizedWord = normalizeUnicode(word);

      if (!dictionary.isKnownWord(word) && !dictionary.isKnownWord(normalizedWord)) {
        let knownViaSuffix = false;
        for (const suffix of BANGLA_SUFFIXES) {
          if (word.length > suffix.length && word.endsWith(suffix)) {
            const stem = word.slice(0, word.length - suffix.length);
            if (stem.length >= 2 && (dictionary.isKnownWord(stem) || dictionary.isKnownWord(normalizeUnicode(stem)))) {
              knownViaSuffix = true;
              break;
            }
          }
        }

        if (!knownViaSuffix) {
          const commonFix = commonMistakes[normalizedWord] ?? commonMistakes[word];
          if (commonFix) {
            errors.push({
              word,
              correction: commonFix,
              startIndex,
              endIndex,
              confidence: 95,
            });
          }
        }
      }
    }

    return errors;
  }

  function getSpellingSuggestions(word: string, limit: number = 5, prevWord?: string): string[] {
    if (!word || word.length < 2) return [];

    const isKnown = dictionary.isKnownWord(word);

    const commonFix = commonMistakes[word];

    const candidates = new Set<string>();
    const minPrefixLen = isKnown
      ? Math.max(2, word.length - 1)
      : Math.max(1, word.length - 2);
    const maxPrefixLen = word.length;

    for (let prefixLen = minPrefixLen; prefixLen <= maxPrefixLen; prefixLen++) {
      if (prefixLen < 1) continue;
      const prefix = word.slice(0, prefixLen);
      for (const s of dictionary.getSuggestions(prefix, 20)) {
        candidates.add(s);
      }
    }

    if (isKnown) {
      for (const suffix of BANGLA_SUFFIXES) {
        const suffixed = word + suffix;
        if (dictionary.isKnownWord(suffixed)) {
          candidates.add(suffixed);
        }
      }
    }

    const maxDist = isKnown
      ? Math.min(1.5, word.length * 0.3)
      : Math.min(2, word.length * 0.4);

    const contextWords = prevWord ? new Set(bigrams.getSuggestions(prevWord, 50)) : new Set<string>();

    const scored: { word: string; score: number }[] = [];

    if (commonFix && dictionary.isKnownWord(commonFix)) {
      scored.push({ word: commonFix, score: contextWords.has(commonFix) ? -1 : 0 });
    }

    for (const candidate of candidates) {
      if (candidate === word) continue;

      if (!dictionary.isKnownWord(candidate)) continue;

      if (Math.abs(candidate.length - word.length) > 3) continue;

      const dist = phoneticDistance(word, candidate);
      if (dist <= maxDist) {
        const contextBoost = contextWords.has(candidate) ? 0.5 : 0;
        scored.push({ word: candidate, score: dist - contextBoost });
      }
    }

    scored.sort((a, b) => a.score - b.score || a.word.length - b.word.length);

    return scored.slice(0, limit).map(s => s.word);
  }

  return { checkSpelling, getSpellingSuggestions };
}
