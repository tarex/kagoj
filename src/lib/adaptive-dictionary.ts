import { AdaptiveDictionary, LocalStorageAdapter } from 'kagoj-input';

// Re-export the class for type usage
export { AdaptiveDictionary };

// Singleton instance with localStorage, matching the original behavior
export const adaptiveDictionary = new AdaptiveDictionary(new LocalStorageAdapter());
