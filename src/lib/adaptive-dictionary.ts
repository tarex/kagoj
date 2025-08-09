import { banglaDictionary as baseDictionary } from './bangla-dictionary';

const LEARNED_WORDS_KEY = 'bangla_learned_words';
const WORD_FREQUENCY_KEY = 'bangla_word_frequency';
const MIN_WORD_LENGTH = 2;
const MAX_LEARNED_WORDS = 5000; // Limit to prevent storage issues

interface WordFrequency {
  [word: string]: number;
}

class AdaptiveDictionary {
  private learnedWords: Set<string>;
  private wordFrequency: WordFrequency;
  private combinedDictionary: string[];
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.learnedWords = new Set();
    this.wordFrequency = {};
    this.combinedDictionary = [...baseDictionary];
    // Don't load from storage in constructor to avoid SSR issues
    // loadFromStorage will be called from initializeOnClient
  }
  
  public initializeOnClient(): void {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    // Only access localStorage on the client side
    if (typeof window === 'undefined') {
      this.rebuildDictionary();
      return;
    }
    
    try {
      // Load learned words
      const savedWords = localStorage.getItem(LEARNED_WORDS_KEY);
      if (savedWords) {
        const words = JSON.parse(savedWords);
        this.learnedWords = new Set(words);
        console.log(`Loaded ${this.learnedWords.size} learned words from storage`);
      }

      // Load word frequency
      const savedFrequency = localStorage.getItem(WORD_FREQUENCY_KEY);
      if (savedFrequency) {
        this.wordFrequency = JSON.parse(savedFrequency);
        console.log('Loaded word frequency data');
      }

      // Rebuild combined dictionary
      this.rebuildDictionary();
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

  private rebuildDictionary(): void {
    // Combine base dictionary with learned words
    const allWords = new Set([...baseDictionary, ...this.learnedWords]);
    
    // Sort by frequency (most used first) and then alphabetically
    this.combinedDictionary = Array.from(allWords).sort((a, b) => {
      const freqA = this.wordFrequency[a] || 0;
      const freqB = this.wordFrequency[b] || 0;
      
      if (freqA !== freqB) {
        return freqB - freqA; // Higher frequency first
      }
      
      return a.localeCompare(b, 'bn');
    });
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

      // Add to learned words if not in base dictionary
      if (!baseDictionary.includes(word) && !this.learnedWords.has(word)) {
        this.learnedWords.add(word);
        newWordsAdded++;
        console.log('Learned new word:', word);
      }
    }

    if (newWordsAdded > 0) {
      this.rebuildDictionary();
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

    // Add to learned words if new
    if (!baseDictionary.includes(cleanedWord) && !this.learnedWords.has(cleanedWord)) {
      this.learnedWords.add(cleanedWord);
      this.rebuildDictionary();
      console.log('Learned new word:', cleanedWord);
    }

    this.saveToStorage();
  }

  public getSuggestions(partial: string, limit: number = 5): string[] {
    if (!partial || partial.length < 1) return [];

    const cleanedPartial = this.cleanWord(partial);
    console.log('Getting adaptive suggestions for:', cleanedPartial);

    // Filter words that start with the partial
    const matches = this.combinedDictionary.filter(word => 
      word.startsWith(cleanedPartial) && word !== cleanedPartial
    );

    // Sort by frequency and length
    matches.sort((a, b) => {
      // First by frequency
      const freqA = this.wordFrequency[a] || 0;
      const freqB = this.wordFrequency[b] || 0;
      
      if (freqA !== freqB) {
        return freqB - freqA;
      }
      
      // Then by length (shorter first)
      if (a.length !== b.length) {
        return a.length - b.length;
      }
      
      return a.localeCompare(b, 'bn');
    });

    const suggestions = matches.slice(0, limit);
    console.log('Adaptive suggestions:', suggestions);
    return suggestions;
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
      totalWords: this.combinedDictionary.length,
      learnedWords: this.learnedWords.size,
      topWords
    };
  }

  public removeWord(word: string): void {
    const normalizedWord = word.trim().toLowerCase();
    
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
    
    // Rebuild dictionary and save
    this.rebuildDictionary();
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
        oldFrequency + 1
      );
      console.log(`Replaced "${normalizedOld}" with "${normalizedNew}" (frequency: ${this.wordFrequency[normalizedNew]})`);
      
      this.rebuildDictionary();
      this.saveToStorage();
    }
  }

  public clearLearnedWords(): void {
    this.learnedWords.clear();
    this.wordFrequency = {};
    this.rebuildDictionary();
    
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