import { Transliterator } from './core/transliterator';
import type { TransliterationRule } from './core/types';

/**
 * Create a reusable transliterator instance with optional custom rules.
 */
export function createTransliterator(rules?: TransliterationRule[]): Transliterator {
  const t = new Transliterator(rules);
  t.enable();
  return t;
}

/**
 * Transliterate a complete string from phonetic English to Bangla.
 * Stateless convenience function -- creates a fresh transliterator per call.
 *
 * For repeated use, prefer `createTransliterator()` to reuse state.
 */
export function transliterate(input: string): string {
  const t = createTransliterator();
  let result = '';
  for (const char of input) {
    result = t.handleKeyPress(result, char);
  }
  return result;
}
