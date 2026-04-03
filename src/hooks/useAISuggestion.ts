import { useState, useRef, useCallback, useEffect } from 'react';
import { LRUCache } from '@/lib/lru-cache';

const AI_CACHE_SIZE = 50;
const AI_RATE_LIMIT_MS = 2000;
// exported for reference (500ms wait after word boundary before triggering)
export const AI_TRIGGER_DELAY_MS = 500;

/** Module-level cache shared across all hook instances */
const suggestionCache = new LRUCache<string, string>(AI_CACHE_SIZE);

/** Lightweight tone detection from text patterns */
function detectTone(text: string): string {
  if (!text || text.length < 20) return 'neutral';
  const sample = text.slice(-300);
  const hasApni = /আপনি|আপনার|আপনাকে/.test(sample);
  const hasTumi = /তুমি|তোমার|তোমাকে/.test(sample);
  const hasTui = /তুই|তোর|তোকে/.test(sample);
  const hasSadhu = /করিয়া|হইতে|হইল|করিলে/.test(sample);
  if (hasSadhu) return 'literary/sadhu';
  if (hasTui) return 'very informal (tui)';
  if (hasTumi) return 'informal (tumi)';
  if (hasApni) return 'formal (apni)';
  return 'neutral';
}

/** Timestamp of the last AI request, shared across hook instances */
let lastRequestTime = 0;

export interface UseAISuggestionReturn {
  aiSuggestion: string;
  isLoadingAI: boolean;
  requestAISuggestion: (cursorContext: string, fullText?: string, noteTitle?: string) => void;
  clearAISuggestion: () => void;
  clearSuggestionCache: () => void;
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
    (cursorContext: string, fullText?: string, noteTitle?: string) => {
      if (!isBanglaMode) {
        setAiSuggestion('');
        return;
      }

      // Send more context for better topic awareness (up to 500 chars)
      const trimmedContext =
        cursorContext.length > 500
          ? cursorContext.slice(-500)
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

      // Extract the current partial word only if cursor is actually mid-word
      // (context does not end with whitespace). After space trigger, don't send
      // the just-finished word as it biases the model to re-complete it.
      let currentWord: string | undefined;
      if (trimmedContext.length > 0 && !/\s$/.test(trimmedContext)) {
        const words = trimmedContext.split(/\s+/);
        currentWord = words.length > 0 ? words[words.length - 1] : undefined;
      }

      // Cache key: current paragraph topic (first 50 chars) + trailing 80 chars of context.
      // This prevents cross-topic cache hits when recent text is similar.
      const fullText2 = fullText ?? cursorContext;
      const paragraphs = fullText2.split(/\n\n/);
      const currentParagraph = paragraphs[paragraphs.length - 1] ?? '';
      const topicHint = currentParagraph.slice(0, 50);
      const cacheKey = topicHint + '|' + trimmedContext.slice(-80);

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
          noteTitle,
          toneHint: detectTone(text),
        }),
        signal: controller.signal,
      })
        .then(async (res) => {
          const data = (await res.json()) as { suggestion?: string; source?: string };
          const suggestion = data.suggestion ?? '';
          // Only cache non-empty results; empty responses may be transient failures
          if (suggestion) {
            suggestionCache.set(cacheKey, suggestion);
          }
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

  const clearSuggestionCache = useCallback(() => {
    suggestionCache.clear();
  }, []);

  // Abort in-flight request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { aiSuggestion, isLoadingAI, requestAISuggestion, clearAISuggestion, clearSuggestionCache };
}
