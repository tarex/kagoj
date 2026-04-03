import { BigramStore, LocalStorageAdapter } from 'kagoj-input';

// Re-export the class for type usage
export { BigramStore };

// Singleton instance with localStorage, matching the original behavior
export const bigramStore = new BigramStore(new LocalStorageAdapter());
