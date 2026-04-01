import type { StorageAdapter } from '../core/types';

const BIGRAM_KEY = 'bangla_bigrams';
const MAX_BIGRAMS = 5000;

interface BigramEntry {
  count: number;
  lastUsed: number;
}

type BigramMap = Map<string, Map<string, BigramEntry>>;

const RECENCY_DECAY = 0.95;

function effectiveScore(entry: BigramEntry): number {
  const days = (Date.now() - entry.lastUsed) / (1000 * 60 * 60 * 24);
  return entry.count * Math.pow(RECENCY_DECAY, days);
}

export class BigramStore {
  private bigrams: BigramMap = new Map();
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private storage: StorageAdapter | null;

  constructor(storage?: StorageAdapter) {
    this.storage = storage ?? null;
  }

  public initializeOnClient(): void {
    this.loadFromStorage();
  }

  /** Learn bigrams from a block of text */
  public learnFromText(text: string): void {
    if (!text) return;

    const banglaWordRegex = /[\u0980-\u09FF]+/g;
    const words: string[] = [];
    let match;
    while ((match = banglaWordRegex.exec(text)) !== null) {
      if (match[0].length >= 2) {
        words.push(match[0]);
      }
    }

    let added = 0;
    for (let i = 0; i < words.length - 1; i++) {
      const prev = words[i];
      const next = words[i + 1];
      this.recordBigram(prev, next);
      added++;
    }

    if (added > 0) {
      this.scheduleSave();
    }
  }

  /** Record a single word pair */
  public recordBigram(prevWord: string, nextWord: string): void {
    if (!this.bigrams.has(prevWord)) {
      this.bigrams.set(prevWord, new Map());
    }
    const followers = this.bigrams.get(prevWord)!;
    const existing = followers.get(nextWord);
    if (existing) {
      existing.count++;
      existing.lastUsed = Date.now();
    } else {
      followers.set(nextWord, { count: 1, lastUsed: Date.now() });
    }
  }

  /** Get next-word suggestions given the previous word, sorted by score */
  public getSuggestions(prevWord: string, limit: number = 5): string[] {
    const followers = this.bigrams.get(prevWord);
    if (!followers) return [];

    const scored: Array<{ word: string; score: number }> = [];
    for (const [word, entry] of followers) {
      scored.push({ word, score: effectiveScore(entry) });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.word);
  }

  /** Get next-word suggestions filtered by a prefix */
  public getSuggestionsWithPrefix(prevWord: string, prefix: string, limit: number = 5): string[] {
    const followers = this.bigrams.get(prevWord);
    if (!followers) return [];

    const scored: Array<{ word: string; score: number }> = [];
    for (const [word, entry] of followers) {
      if (word.startsWith(prefix) && word !== prefix) {
        scored.push({ word, score: effectiveScore(entry) });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.word);
  }

  private scheduleSave(): void {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.saveToStorage(), 2000);
  }

  private loadFromStorage(): void {
    if (!this.storage) return;
    try {
      const raw = this.storage.getItem(BIGRAM_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as Array<[string, Array<[string, BigramEntry]>]>;
      this.bigrams = new Map(
        data.map(([prev, followers]) => [prev, new Map(followers)])
      );
      console.log(`Loaded ${this.bigrams.size} bigram entries`);
    } catch (err) {
      console.error('Error loading bigrams:', err);
    }
  }

  private saveToStorage(): void {
    if (!this.storage) return;
    try {
      // Flatten, score, keep top MAX_BIGRAMS pairs
      const all: Array<{ prev: string; next: string; score: number; entry: BigramEntry }> = [];
      for (const [prev, followers] of this.bigrams) {
        for (const [next, entry] of followers) {
          all.push({ prev, next, score: effectiveScore(entry), entry });
        }
      }
      all.sort((a, b) => b.score - a.score);
      const kept = all.slice(0, MAX_BIGRAMS);

      // Rebuild into serializable structure
      const grouped = new Map<string, Array<[string, BigramEntry]>>();
      for (const { prev, next, entry } of kept) {
        if (!grouped.has(prev)) grouped.set(prev, []);
        grouped.get(prev)!.push([next, entry]);
      }

      const serializable = Array.from(grouped.entries());
      this.storage.setItem(BIGRAM_KEY, JSON.stringify(serializable));
    } catch (err) {
      console.error('Error saving bigrams:', err);
    }
  }

  /** Seed with pre-built collocation data (won't overwrite user data) */
  public seed(pairs: Array<[string, string, number?]>): void {
    for (const [prev, next, count] of pairs) {
      if (!this.bigrams.has(prev)) {
        this.bigrams.set(prev, new Map());
      }
      const followers = this.bigrams.get(prev)!;
      // Only seed if user hasn't already learned this pair
      if (!followers.has(next)) {
        followers.set(next, { count: count ?? 1, lastUsed: Date.now() - 7 * 24 * 60 * 60 * 1000 });
      }
    }
  }
}
