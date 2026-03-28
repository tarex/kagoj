import { BanglaTrie } from './trie';
import { comprehensiveBanglaWords } from './bangla-words-comprehensive';

const LEARNED_WORDS_KEY = 'bangla_learned_words';
const WORD_FREQUENCY_KEY = 'bangla_word_frequency';
const MIN_WORD_LENGTH = 2;
const MAX_LEARNED_WORDS = 5000; // Limit to prevent storage issues

// Common Bangla suffixes for suggestion expansion (longest first)
const BANGLA_SUFFIXES = [
  'গুলো', 'গুলি', 'দের', 'তে', 'কে', 'রা', 'ের', 'র', 'ে', 'য়', 'তি', 'নি',
];

interface WordFrequencyEntry {
  count: number;
  lastUsed: number; // timestamp in ms
}

interface WordFrequency {
  [word: string]: number | WordFrequencyEntry;
}

/** Normalize old flat-number format to { count, lastUsed } */
function normalizeEntry(entry: number | WordFrequencyEntry): WordFrequencyEntry {
  if (typeof entry === 'number') {
    return { count: entry, lastUsed: Date.now() };
  }
  return entry;
}

/** Recency decay factor: score = count * 0.95^daysSinceLastUse */
const RECENCY_DECAY = 0.95;

function computeEffectiveScore(entry: WordFrequencyEntry): number {
  const daysSinceLastUse = (Date.now() - entry.lastUsed) / (1000 * 60 * 60 * 24);
  return entry.count * Math.pow(RECENCY_DECAY, daysSinceLastUse);
}

class AdaptiveDictionary {
  private trie: BanglaTrie;
  private learnedWords: Set<string>;
  private wordFrequency: WordFrequency;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.trie = new BanglaTrie();
    this.learnedWords = new Set();
    this.wordFrequency = {};
    // Don't load words in constructor to avoid SSR issues
    // initializeOnClient() should be called from client side
  }

  public initializeOnClient(): void {
    const startTime = Date.now();
    for (const word of comprehensiveBanglaWords) {
      this.trie.insert(word);
    }
    this.loadFromStorage();
    const elapsed = Date.now() - startTime;
    console.log(`Dictionary initialized: ${this.trie.size()} words in ${elapsed}ms`);
  }

  private loadFromStorage(): void {
    // Only access localStorage on the client side
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Load learned words
      const savedWords = localStorage.getItem(LEARNED_WORDS_KEY);
      if (savedWords) {
        const words = JSON.parse(savedWords) as string[];
        this.learnedWords = new Set(words);
        console.log(`Loaded ${this.learnedWords.size} learned words from storage`);
      }

      // Load word frequency
      const savedFrequency = localStorage.getItem(WORD_FREQUENCY_KEY);
      if (savedFrequency) {
        this.wordFrequency = JSON.parse(savedFrequency) as WordFrequency;
        console.log('Loaded word frequency data');
      }

      // Insert each learned word into trie with recency-weighted frequency
      for (const word of this.learnedWords) {
        const raw = this.wordFrequency[word];
        const entry = raw ? normalizeEntry(raw) : { count: 1, lastUsed: Date.now() };
        // Migrate old format in-place
        this.wordFrequency[word] = entry;
        this.trie.insert(word, computeEffectiveScore(entry));
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }

  private saveToStorage(): void {
    // Only access localStorage on the client side
    if (typeof window === 'undefined') {
      return;
    }

    // Debounce saves to avoid too frequent writes
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      try {
        // Save learned words (limit size)
        const wordsArray = Array.from(this.learnedWords).slice(-MAX_LEARNED_WORDS);
        localStorage.setItem(LEARNED_WORDS_KEY, JSON.stringify(wordsArray));

        // Save word frequency (keep only top scoring words by recency-weighted score)
        const sortedWords = Object.entries(this.wordFrequency)
          .sort((a, b) => {
            const scoreA = computeEffectiveScore(normalizeEntry(a[1]));
            const scoreB = computeEffectiveScore(normalizeEntry(b[1]));
            return scoreB - scoreA;
          })
          .slice(0, MAX_LEARNED_WORDS);
        const limitedFrequency = Object.fromEntries(sortedWords);
        localStorage.setItem(WORD_FREQUENCY_KEY, JSON.stringify(limitedFrequency));

        console.log('Saved dictionary to storage');
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }, 1000); // Save after 1 second of inactivity
  }

  private isBanglaWord(word: string): boolean {
    // Check if the word contains Bangla characters
    const banglaRegex = /[\u0980-\u09FF]/;
    return banglaRegex.test(word);
  }

  private cleanWord(word: string): string {
    // Remove common punctuation and clean the word
    return word.replace(/[\.,;!?\u0964\u0965\(\)\[\]\{\}"'`।]/g, '').trim();
  }

  public learnFromText(text: string): void {
    if (!text) return;

    // Split text into words and count occurrences
    const words = text.split(/[\s\n]+/);
    const wordCounts = new Map<string, number>();

    for (const rawWord of words) {
      const word = this.cleanWord(rawWord);
      if (word.length < MIN_WORD_LENGTH || !this.isBanglaWord(word)) {
        continue;
      }
      wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
    }

    let newWordsAdded = 0;

    for (const [word, count] of wordCounts) {
      const isKnown = this.trie.search(word);

      // Only learn unknown words if they appear 2+ times in the text
      // (single-occurrence unknowns are likely misspellings)
      if (!isKnown && count < 2) {
        continue;
      }

      // Update frequency with recency
      const existing = this.wordFrequency[word];
      const prev = existing ? normalizeEntry(existing) : { count: 0, lastUsed: Date.now() };
      const updated: WordFrequencyEntry = { count: prev.count + count, lastUsed: Date.now() };
      this.wordFrequency[word] = updated;

      // Insert into trie with recency-weighted score
      this.trie.insert(word, computeEffectiveScore(updated));

      // Track as learned if newly added
      if (!this.learnedWords.has(word)) {
        this.learnedWords.add(word);
        newWordsAdded++;
        console.log('Learned new word:', word);
      }
    }

    if (newWordsAdded > 0) {
      this.saveToStorage();
      console.log(`Added ${newWordsAdded} new words to dictionary`);
    }
  }

  public learnWord(word: string): void {
    const cleanedWord = this.cleanWord(word);

    if (cleanedWord.length < MIN_WORD_LENGTH || !this.isBanglaWord(cleanedWord)) {
      return;
    }

    // Update frequency with recency
    const existing = this.wordFrequency[cleanedWord];
    const prev = existing ? normalizeEntry(existing) : { count: 0, lastUsed: Date.now() };
    const updated: WordFrequencyEntry = { count: prev.count + 1, lastUsed: Date.now() };
    this.wordFrequency[cleanedWord] = updated;

    // Insert into trie with recency-weighted score
    this.trie.insert(cleanedWord, computeEffectiveScore(updated));

    // Track in learnedWords Set for localStorage persistence
    if (!this.learnedWords.has(cleanedWord)) {
      this.learnedWords.add(cleanedWord);
      console.log('Learned new word:', cleanedWord);
    }

    this.saveToStorage();
  }

  public getSuggestions(partial: string, limit: number = 5): string[] {
    if (!partial || partial.length < 1) return [];

    const cleanedPartial = this.cleanWord(partial);

    // Try exact prefix first (includes suffix-extended forms since they share the prefix)
    let suggestions = this.trie.getSuggestions(cleanedPartial, limit)
      .filter(word => word !== cleanedPartial);

    // If the partial is a known word with few prefix completions,
    // boost suffix-expanded forms that exist in the trie
    if (suggestions.length < limit && this.trie.search(cleanedPartial)) {
      for (const suffix of BANGLA_SUFFIXES) {
        const suffixed = cleanedPartial + suffix;
        if (this.trie.search(suffixed) && !suggestions.includes(suffixed)) {
          suggestions.push(suffixed);
          if (suggestions.length >= limit) break;
        }
      }
    }

    // Fall back to fuzzy matching when exact prefix yields nothing (typo recovery)
    if (suggestions.length === 0 && cleanedPartial.length >= 3) {
      suggestions = this.trie.getFuzzySuggestions(cleanedPartial, 1, limit)
        .filter(word => word !== cleanedPartial);
    }

    return suggestions;
  }

  /**
   * Returns true if the word is known (in the trie — includes both comprehensive
   * dictionary and learned words).
   */
  public isKnownWord(word: string): boolean {
    return this.trie.search(word);
  }

  public removeWord(word: string): void {
    const normalizedWord = word.trim().toLowerCase();

    // Remove from trie
    this.trie.delete(normalizedWord);

    // Remove from learned words
    if (this.learnedWords.has(normalizedWord)) {
      this.learnedWords.delete(normalizedWord);
      console.log(`Removed "${normalizedWord}" from learned words`);
    }

    // Remove from frequency tracking
    if (this.wordFrequency[normalizedWord]) {
      delete this.wordFrequency[normalizedWord];
      console.log(`Removed "${normalizedWord}" from frequency tracking`);
    }

    this.saveToStorage();
  }

  public replaceWord(oldWord: string, newWord: string): void {
    const normalizedOld = oldWord.trim().toLowerCase();
    const normalizedNew = newWord.trim().toLowerCase();

    // Get the frequency of the old word (if it exists)
    const oldRaw = this.wordFrequency[normalizedOld];
    const oldCount = oldRaw ? normalizeEntry(oldRaw).count : 0;

    // Remove the old word
    this.removeWord(normalizedOld);

    // Add the new word with the same or higher frequency
    if (normalizedNew && normalizedNew.length >= MIN_WORD_LENGTH) {
      this.learnedWords.add(normalizedNew);
      const existingRaw = this.wordFrequency[normalizedNew];
      const existingCount = existingRaw ? normalizeEntry(existingRaw).count : 0;
      const newEntry: WordFrequencyEntry = {
        count: Math.max(existingCount, oldCount + 1),
        lastUsed: Date.now(),
      };
      this.wordFrequency[normalizedNew] = newEntry;
      this.trie.insert(normalizedNew, computeEffectiveScore(newEntry));
      console.log(`Replaced "${normalizedOld}" with "${normalizedNew}" (count: ${newEntry.count})`);

      this.saveToStorage();
    }
  }

  public clearLearnedWords(): void {
    this.learnedWords.clear();
    this.wordFrequency = {};

    // Rebuild trie from scratch with just comprehensiveBanglaWords
    this.trie = new BanglaTrie();
    for (const word of comprehensiveBanglaWords) {
      this.trie.insert(word);
    }

    // Only access localStorage on the client side
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LEARNED_WORDS_KEY);
      localStorage.removeItem(WORD_FREQUENCY_KEY);
    }

    console.log('Cleared all learned words');
  }
}

// Export singleton instance
export const adaptiveDictionary = new AdaptiveDictionary();
