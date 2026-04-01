// Core
export { Transliterator } from './core/transliterator';
export { contextPatterns } from './core/rules';
export type {
  TransliterationRule,
  StorageAdapter,
  SuggestionResult,
  SpellingError,
  BanglaInputOptions,
} from './core/types';

// Pure transliteration
export { transliterate, createTransliterator } from './transliterate';

// DOM adapter
export { BanglaInput } from './adapters/dom-adapter';

// Storage adapters
export { LocalStorageAdapter, MemoryStorageAdapter } from './adapters/storage';

// Dictionary
export { BanglaTrie } from './dictionary/trie';
export type { TrieNode } from './dictionary/trie';
export { AdaptiveDictionary } from './dictionary/adaptive-dictionary';
export { BigramStore } from './dictionary/bigram-store';
export { LRUCache } from './dictionary/lru-cache';

// Spellcheck
export { createSpellChecker } from './spellcheck/spell-checker';
export { phoneticDistance } from './spellcheck/phonetic-distance';
export { isCommonMistake, commonMistakes } from './spellcheck/common-mistakes';

// Data (re-exported for convenience; also available via subpath imports)
export { comprehensiveBanglaWords } from './data/words';
export { banglaCollocations } from './data/collocations';
