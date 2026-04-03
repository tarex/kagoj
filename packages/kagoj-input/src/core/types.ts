export interface TransliterationRule {
  pattern: string;
  contextPattern?: string;
  replacement: string;
}

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SuggestionResult {
  words: string[];
  partial: string;
}

export interface SpellingError {
  word: string;
  correction: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

export interface BanglaInputOptions {
  /** Enable dictionary-based suggestions. Default: true */
  suggestions?: boolean;
  /** Storage adapter for persistence. Default: LocalStorageAdapter */
  storage?: StorageAdapter;
  /** Custom transliteration rules. Default: built-in contextPatterns */
  rules?: TransliterationRule[];
  /** Callback when suggestions are available */
  onSuggestion?: (result: SuggestionResult) => void;
  /** Callback when text changes (after transliteration) */
  onChange?: (value: string) => void;
  /** Initial enabled state. Default: true */
  enabled?: boolean;
}
