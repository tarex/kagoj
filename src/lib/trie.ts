/**
 * Trie data structure for fast Bangla word lookup with frequency support.
 * Uses Map for children to handle Unicode characters (Bangla script) correctly.
 */

export interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  frequency: number;
  word: string | null;
}

/** Creates a new TrieNode with default values */
function createTrieNode(): TrieNode {
  return {
    children: new Map(),
    isEndOfWord: false,
    frequency: 0,
    word: null,
  };
}

export class BanglaTrie {
  private root: TrieNode;
  private wordCount: number;

  constructor() {
    this.root = createTrieNode();
    this.wordCount = 0;
  }

  /**
   * Insert a word into the trie.
   * If the word already exists, adds the frequency to the existing frequency.
   */
  insert(word: string, frequency: number = 1): void {
    let node = this.root;

    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, createTrieNode());
      }
      node = node.children.get(char)!;
    }

    if (!node.isEndOfWord) {
      node.isEndOfWord = true;
      node.word = word;
      node.frequency = frequency;
      this.wordCount++;
    } else {
      // Word already exists — accumulate frequency
      node.frequency += frequency;
    }
  }

  /**
   * Returns true if the exact word exists in the trie.
   */
  search(word: string): boolean {
    const node = this.findNode(word);
    return node !== null && node.isEndOfWord;
  }

  /**
   * Returns true if any word in the trie starts with the given prefix.
   */
  hasPrefix(prefix: string): boolean {
    return this.findNode(prefix) !== null;
  }

  /**
   * Returns up to `limit` words starting with `prefix`, sorted by
   * frequency descending then by word length ascending.
   */
  getSuggestions(prefix: string, limit: number = 10): string[] {
    const prefixNode = this.findNode(prefix);
    if (prefixNode === null) return [];

    const matches: Array<{ word: string; frequency: number }> = [];
    this.collectWords(prefixNode, matches);

    matches.sort((a, b) => {
      if (b.frequency !== a.frequency) return b.frequency - a.frequency;
      return a.word.length - b.word.length;
    });

    return matches.slice(0, limit).map(m => m.word);
  }

  /**
   * Returns the frequency of the given word, or 0 if not found.
   */
  getFrequency(word: string): number {
    const node = this.findNode(word);
    if (node === null || !node.isEndOfWord) return 0;
    return node.frequency;
  }

  /**
   * Sets the frequency of an existing word.
   * Does nothing if the word is not in the trie.
   */
  setFrequency(word: string, frequency: number): void {
    const node = this.findNode(word);
    if (node !== null && node.isEndOfWord) {
      node.frequency = frequency;
    }
  }

  /**
   * Returns the total count of words in the trie.
   */
  size(): number {
    return this.wordCount;
  }

  /**
   * Returns all words stored in the trie (for serialization/debug).
   */
  getAllWords(): string[] {
    const result: Array<{ word: string; frequency: number }> = [];
    this.collectWords(this.root, result);
    return result.map(r => r.word);
  }

  /**
   * Soft-deletes a word by setting isEndOfWord to false.
   * Returns true if the word existed.
   */
  delete(word: string): boolean {
    const node = this.findNode(word);
    if (node !== null && node.isEndOfWord) {
      node.isEndOfWord = false;
      node.word = null;
      node.frequency = 0;
      this.wordCount--;
      return true;
    }
    return false;
  }

  /** Traverses the trie to find the node at the end of the given string. */
  private findNode(str: string): TrieNode | null {
    let node = this.root;
    for (const char of str) {
      if (!node.children.has(char)) return null;
      node = node.children.get(char)!;
    }
    return node;
  }

  /** DFS to collect all end-of-word nodes from a given starting node. */
  private collectWords(
    node: TrieNode,
    result: Array<{ word: string; frequency: number }>
  ): void {
    if (node.isEndOfWord && node.word !== null) {
      result.push({ word: node.word, frequency: node.frequency });
    }
    for (const child of node.children.values()) {
      this.collectWords(child, result);
    }
  }
}
