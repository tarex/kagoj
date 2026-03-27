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
      // Word already exists — set to new frequency (supports recency-weighted scores)
      node.frequency = Math.max(node.frequency, frequency);
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

  /**
   * Returns words within `maxEdits` edit distance of `query`, sorted by
   * frequency desc. Uses row-by-row Levenshtein traversal of the trie
   * (Steve Hanov's technique) — avoids full dictionary scan.
   */
  getFuzzySuggestions(query: string, maxEdits: number = 1, limit: number = 10): string[] {
    const queryChars = [...query];
    const queryLen = queryChars.length;

    // Initial row of the Levenshtein matrix
    const initialRow: number[] = [];
    for (let i = 0; i <= queryLen; i++) initialRow.push(i);

    const results: Array<{ word: string; frequency: number; distance: number }> = [];

    // Recursive DFS through the trie, carrying the current Levenshtein row
    const search = (node: TrieNode, prevRow: number[]) => {
      for (const [char, childNode] of node.children) {
        const currentRow: number[] = [prevRow[0] + 1];

        for (let col = 1; col <= queryLen; col++) {
          const insertCost = currentRow[col - 1] + 1;
          const deleteCost = prevRow[col] + 1;
          const replaceCost = prevRow[col - 1] + (queryChars[col - 1] === char ? 0 : 1);
          currentRow.push(Math.min(insertCost, deleteCost, replaceCost));
        }

        // If any value in this row is within maxEdits, keep searching
        const minInRow = Math.min(...currentRow);
        if (minInRow <= maxEdits) {
          // If this node is a word and the last column is within maxEdits, it's a match
          if (childNode.isEndOfWord && childNode.word !== null && currentRow[queryLen] <= maxEdits) {
            results.push({
              word: childNode.word,
              frequency: childNode.frequency,
              distance: currentRow[queryLen],
            });
          }
          search(childNode, currentRow);
        }
      }
    };

    search(this.root, initialRow);

    // Sort: closer distance first, then higher frequency, then shorter word
    results.sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      if (b.frequency !== a.frequency) return b.frequency - a.frequency;
      return a.word.length - b.word.length;
    });

    return results.slice(0, limit).map(r => r.word);
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
