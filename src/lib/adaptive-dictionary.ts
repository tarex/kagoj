import { BanglaTrie } from './trie';
import { comprehensiveBanglaWords } from './bangla-words-comprehensive';

const LEARNED_WORDS_KEY = 'bangla_learned_words';
const WORD_FREQUENCY_KEY = 'bangla_word_frequency';
const MIN_WORD_LENGTH = 2;
const MAX_LEARNED_WORDS = 5000; // Limit to prevent storage issues

interface WordFrequency {
  [word: string]: number;
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

      // Insert each learned word into trie with its frequency
      for (const word of this.learnedWords) {
        this.trie.insert(word, this.wordFrequency[word] || 1);
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

        // Save word frequency (keep only top frequent words)
        const sortedWords = Object.entries(this.wordFrequency)
          .sort((a, b) => b[1] - a[1])
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

    // Split text into words
    const words = text.split(/[\s\n]+/);
    let newWordsAdded = 0;

    for (const rawWord of words) {
      const word = this.cleanWord(rawWord);

      // Skip if too short or not Bangla
      if (word.length < MIN_WORD_LENGTH || !this.isBanglaWord(word)) {
        continue;
      }

      // Update frequency
      this.wordFrequency[word] = (this.wordFrequency[word] || 0) + 1;

      // Insert into trie with updated frequency
      this.trie.insert(word, this.wordFrequency[word]);

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

    // Update frequency
    this.wordFrequency[cleanedWord] = (this.wordFrequency[cleanedWord] || 0) + 1;

    // Insert into trie with updated frequency
    this.trie.insert(cleanedWord, this.wordFrequency[cleanedWord]);

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
    console.log('Getting adaptive suggestions for:', cleanedPartial);

    const suggestions = this.trie.getSuggestions(cleanedPartial, limit)
      .filter(word => word !== cleanedPartial);

    console.log('Adaptive suggestions:', suggestions);
    return suggestions;
  }

  /**
   * Returns true if the word is known (in the trie — includes both comprehensive
   * dictionary and learned words).
   */
  public isKnownWord(word: string): boolean {
    return this.trie.search(word);
  }

  public getWordStats(word: string): { count: number } | null {
    const count = this.wordFrequency[word];
    if (count) {
      return { count };
    }
    return null;
  }

  public getStats(): { totalWords: number; learnedWords: number; topWords: [string, number][] } {
    const topWords = Object.entries(this.wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      totalWords: this.trie.size(),
      learnedWords: this.learnedWords.size,
      topWords,
    };
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
    const oldFrequency = this.wordFrequency[normalizedOld] || 0;

    // Remove the old word
    this.removeWord(normalizedOld);

    // Add the new word with the same or higher frequency
    if (normalizedNew && normalizedNew.length >= MIN_WORD_LENGTH) {
      this.learnedWords.add(normalizedNew);
      // Give it at least the same frequency as the old word, or increment if it already exists
      this.wordFrequency[normalizedNew] = Math.max(
        this.wordFrequency[normalizedNew] || 0,
        oldFrequency + 1,
      );
      this.trie.insert(normalizedNew, this.wordFrequency[normalizedNew]);
      console.log(`Replaced "${normalizedOld}" with "${normalizedNew}" (frequency: ${this.wordFrequency[normalizedNew]})`);

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
