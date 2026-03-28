import { useState, useRef, useCallback, useEffect } from 'react';
import { LRUCache } from '@/lib/lru-cache';

const AI_CACHE_SIZE = 50;
const AI_RATE_LIMIT_MS = 2000;
// exported for reference (500ms wait after word boundary before triggering)
export const AI_TRIGGER_DELAY_MS = 500;

/** Module-level cache shared across all hook instances */
const suggestionCache = new LRUCache<string, string>(AI_CACHE_SIZE);

/** Timestamp of the last AI request, shared across hook instances */
let lastRequestTime = 0;

export interface UseAISuggestionReturn {
  aiSuggestion: string;
  isLoadingAI: boolean;
  requestAISuggestion: (cursorContext: string, fullText?: string) => void;
  clearAISuggestion: () => void;
}

/**
 * React hook that fetches AI ghost text phrase completions from /api/suggestions.
 * Features:
 *  - LRU cache with 50 entries keyed by last 100 chars of context
 *  - Rate limiting: max 1 request per 2 seconds (module-level, shared)
 *  - AbortController cleanup on unmount or new request
 *  - Only fires when isBanglaMode is true
 *
 * @param isBanglaMode - Whether Bangla input mode is active
 */
export function useAISuggestion(isBanglaMode: boolean): UseAISuggestionReturn {
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const requestAISuggestion = useCallback(
    (cursorContext: string, fullText?: string) => {
      if (!isBanglaMode) {
        setAiSuggestion('');
        return;
      }

      // Trim context to last 200 chars
      const trimmedContext =
        cursorContext.length > 200
          ? cursorContext.slice(-200)
          : cursorContext;

      if (trimmedContext.length === 0) return;

      // Extract the last complete sentence for additional context
      const text = fullText ?? cursorContext;
      const sentenceBreaks = /[।.!?\n]/;
      let lastSentence: string | undefined;
      const textBeforeCursor = text.length > 500 ? text.slice(-500) : text;
      const sentences = textBeforeCursor.split(sentenceBreaks).filter(s => s.trim().length > 0);
      if (sentences.length >= 2) {
        lastSentence = sentences[sentences.length - 2].trim();
      }

      // Extract the current partial word (if cursor is mid-word)
      const words = trimmedContext.trimEnd().split(/\s+/);
      const currentWord = words.length > 0 ? words[words.length - 1] : undefined;

      // Cache key derived from last 100 chars
      const cacheKey =
        trimmedContext.length > 100
          ? trimmedContext.slice(-100)
          : trimmedContext;

      // Check cache first
      if (suggestionCache.has(cacheKey)) {
        const cached = suggestionCache.get(cacheKey);
        setAiSuggestion(cached ?? '');
        return;
      }

      // Rate limit check
      const now = Date.now();
      if (now - lastRequestTime < AI_RATE_LIMIT_MS) return;

      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      lastRequestTime = now;
      setIsLoadingAI(true);

      fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cursorContext: trimmedContext,
          lastSentence,
          currentWord,
        }),
        signal: controller.signal,
      })
        .then(async (res) => {
          const data = (await res.json()) as { suggestion?: string; source?: string };
          const suggestion = data.suggestion ?? '';
          suggestionCache.set(cacheKey, suggestion);
          setAiSuggestion(suggestion);
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === 'AbortError') {
            // Intentional abort — do not log
            return;
          }
          console.error('useAISuggestion: fetch error', err);
          setAiSuggestion('');
        })
        .finally(() => {
          setIsLoadingAI(false);
        });
    },
    [isBanglaMode]
  );

  const clearAISuggestion = useCallback(() => {
    setAiSuggestion('');
  }, []);

  // Abort in-flight request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { aiSuggestion, isLoadingAI, requestAISuggestion, clearAISuggestion };
}
