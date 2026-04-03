/**
 * Generic LRU (Least Recently Used) cache implementation.
 * Uses Map to preserve insertion order for efficient eviction.
 * @template K - Key type
 * @template V - Value type
 */
export class LRUCache<K, V> {
  private readonly cache: Map<K, V>;
  private readonly maxSize: number;

  /**
   * @param maxSize - Maximum number of entries before evicting the oldest
   */
  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.cache = new Map<K, V>();
  }

  /**
   * Retrieves a value by key and marks it as most recently used.
   * @param key - The cache key to look up
   * @returns The cached value, or undefined if not found
   */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // Move to end (most recent) by re-inserting
    const value = this.cache.get(key) as V;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * Stores a value in the cache.
   * If over maxSize, evicts the oldest (least recently used) entry.
   * @param key - The cache key
   * @param value - The value to store
   */
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Remove existing to re-insert at end
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict the first (oldest) entry
      const oldestKey = this.cache.keys().next().value as K;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }

  /**
   * Checks whether a key exists in the cache.
   * @param key - The cache key to check
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Removes all entries from the cache.
   */
  clear(): void {
    this.cache.clear();
  }
}
