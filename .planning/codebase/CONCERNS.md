# Codebase Concerns

**Analysis Date:** 2026-03-27

## Tech Debt

**Type Safety Issues (TypeScript `any` usage):**
- Issue: Multiple functions use `any` type annotations, bypassing TypeScript strict mode enforcement
- Files:
  - `src/app/api/suggestions/route.ts` (lines 41, 74)
  - `src/components/note/index.tsx` (lines 213, 339)
  - `src/components/note/note-editor.tsx` (line 7)
  - `src/hooks/useDebounce.ts` (line 4)
- Impact: Reduces type safety, makes refactoring risky, prevents IDE from catching errors
- Fix approach: Replace all `any` with proper types. For example:
  - Line 41 (route.ts): `error: any` → `error: SpellingError`
  - Line 213 (index.tsx): `error: any` → `error: SpellingError`
  - Line 339 (index.tsx): `e: any` → `e: React.ChangeEvent<HTMLTextAreaElement>`
  - Line 7 (note-editor.tsx): `onInput?: (e: any) => void` → `onInput?: (e: React.FormEvent<HTMLTextAreaElement>) => void`
  - Line 4 (useDebounce.ts): Remove generic constraint and define proper callback type

**Excessive Console Logging:**
- Issue: 42+ console.log/error statements throughout codebase left from development
- Files: All major feature files (`route.ts`, `useSpellCheck.ts`, `index.tsx`, `adaptive-dictionary.ts`, `bangla-input-handler.ts`)
- Impact: Logs clutter browser console, expose internal logic, create noise in production
- Fix approach:
  - Remove all non-critical logging
  - Use environment-based logging: only log when `process.env.NODE_ENV === 'development'`
  - Keep only critical error logging for production debugging
  - Implement a logging service with levels (debug, info, error)

**Generic Debounce Hook Type Unsafety:**
- Issue: `useDebounce.ts` uses `unknown as T` cast which undermines type checking
- Files: `src/hooks/useDebounce.ts` (line 31)
- Impact: Callers don't get proper type inference for debounced callbacks
- Fix approach: Properly type the callback wrapper without casting. Define a TypeScript helper type for debounced functions

**Complex Component with Multiple Responsibilities:**
- Issue: `NoteComponent` in `src/components/note/index.tsx` (583 lines) handles too many concerns: spell-checking, input processing, theming, font management, ghost text, note persistence
- Files: `src/components/note/index.tsx`
- Impact: Hard to test, hard to maintain, difficult to reuse spell-check or input handling logic
- Fix approach:
  - Extract theme logic into `useTheme()` hook
  - Extract font size logic into `useFontSize()` hook
  - Move keyboard shortcuts to custom hook `useKeyboardShortcuts()`
  - Keep NoteComponent focused on composition and state orchestration

## Known Bugs

**Spell Check Position Mismatch After Text Edit:**
- Symptoms: After user edits text between spell check rounds, error positions become inaccurate. The API calculates positions for errors, but if user modifies text, cached positions don't match actual word locations
- Files: `src/app/api/suggestions/route.ts` (lines 44-74), `src/hooks/useSpellCheck.ts` (lines 82-108)
- Trigger: 1) Check spelling, 2) Don't accept correction, 3) Edit text elsewhere in document, 4) Click "Fix" → corrects wrong position
- Workaround: Re-run spell check after manual edits (handled by `scheduleSpellCheck` on text change, but there's a 2s delay)
- Fix approach: Either invalidate error positions when text changes, or use a more robust position recovery algorithm that searches for the exact word context, not just `indexOf()`

**Ghost Text Suggestion Not Clearing on Non-Bangla Mode:**
- Symptoms: If user toggles to English mode while ghost suggestion is visible, it may persist incorrectly
- Files: `src/components/note/index.tsx` (line 341)
- Trigger: 1) Type in Bangla, 2) See ghost suggestion, 3) Press Ctrl+Shift+B to switch to English → suggestion might still show
- Workaround: Press Escape or type another character
- Fix approach: Clear `ghostSuggestion` state when `isBanglaMode` changes (add to dependency array or explicit useEffect)

**Potential Memory Leak in Event Listeners:**
- Symptoms: Multiple event listeners (`keydown`, speech synthesis abort) may not be properly cleaned up
- Files:
  - `src/components/note/index.tsx` (line 144-147) - properly cleaned
  - `src/components/note/autocomplete.tsx` (line 50) - properly cleaned
- Trigger: Component unmounts before cleanup runs
- Workaround: None (design is correct with cleanup functions)
- Status: LOW RISK - cleanup is properly implemented

## Security Considerations

**Missing API Key Validation:**
- Risk: `OPENAI_API_KEY` is passed to `/api/suggestions` route but never validated server-side
- Files: `src/app/api/suggestions/route.ts`
- Current mitigation: Next.js prevents client-side access to `process.env` values starting with `NEXT_PUBLIC_`
- Recommendations:
  - Add explicit check: `if (!process.env.OPENAI_API_KEY) { return NextResponse.json({...}, {status: 401}); }`
  - Rate-limit the `/api/suggestions` endpoint to prevent token abuse
  - Log API calls for audit trail

**Local Storage No Validation:**
- Risk: localStorage is parsed with `JSON.parse()` without schema validation. Corrupted or malicious data could break app
- Files:
  - `src/components/note/use-notes.ts` (line 28)
  - `src/lib/adaptive-dictionary.ts` (lines 42-54)
- Current mitigation: try/catch blocks catch parse errors but silently fail
- Recommendations:
  - Use Zod (already in package.json) to validate parsed data: `NotesSchema.parse(savedNotes)`
  - Define schemas: `ZodNote`, `ZodLearnedWords`, `ZodWordFrequency`
  - Log validation errors for debugging

**No Input Sanitization for Spell Check:**
- Risk: User text is sent directly to OpenAI API in prompt without escaping quote characters, which could break JSON parsing
- Files: `src/app/api/suggestions/route.ts` (line 13)
- Current mitigation: API response is try/catch wrapped, fallback returns empty errors
- Recommendations:
  - Escape user text before inserting into prompt template
  - Use template literals safely or parameterize the API call
  - Validate response structure before using

## Performance Bottlenecks

**Large Dictionary Lookups on Every Character:**
- Problem: `updateGhostSuggestion()` calls `adaptiveDictionary.getSuggestions(word, 10)` which rebuilds sorted dictionary and searches through 5000+ words on every keystroke
- Files: `src/components/note/index.tsx` (line 190), `src/lib/adaptive-dictionary.ts` (lines 114-130)
- Cause: Debounce helps (150ms), but dictionary rebuilding is O(n log n) every time
- Current state: Debounce reduces frequency to ~6-7 calls/second at 60 wpm
- Improvement path:
  - Cache sorted dictionary instead of rebuilding on every `getSuggestions()` call
  - Only rebuild when new words are learned
  - Use trie data structure instead of array search for O(k) prefix matching
  - Consider Web Worker for expensive sorting operations

**Spell Check on Every Text Change:**
- Problem: `scheduleSpellCheck()` re-runs full spell check after 2s of inactivity, even for minor edits
- Files: `src/components/note/index.tsx` (line 377), `src/hooks/useSpellCheck.ts` (lines 61-72)
- Cause: User types 1 character → 2s timeout → full document spell check (local dictionary lookup + error position calculation)
- Improvement path:
  - Implement incremental spell-check for only the edited paragraph
  - Track which paragraphs have changed since last check
  - Only re-check changed regions

**Array Operations in Spell Check:**
- Problem: `useSpellCheck.ts` line 127-144 filters and maps error array on every correction
- Files: `src/hooks/useSpellCheck.ts` (lines 127-154)
- Cause: Small performance hit, but O(n) operation where n = number of errors
- Improvement path: For documents with 100+ errors, profile if this becomes noticeable

## Fragile Areas

**Spell Check Position Tracking System:**
- Files: `src/app/api/suggestions/route.ts` (lines 37-74), `src/hooks/useSpellCheck.ts` (lines 74-155)
- Why fragile:
  - API calculates positions using `indexOf()` (naive string search)
  - Positions become stale after any text edit
  - Correction logic searches ±20 chars around expected position to recover
  - If word appears multiple times, first occurrence is always found (not the intended one)
- Safe modification:
  - Add unit tests for position tracking with repeated words
  - Test: "ভাল ভাল" → correct first occurrence → ensure second stays
  - Consider passing word context (before/after) instead of just word
  - Use regex matching with word boundaries instead of naive indexOf
- Test coverage: No unit tests exist

**Adaptive Dictionary Persistence:**
- Files: `src/lib/adaptive-dictionary.ts` (lines 33-91)
- Why fragile:
  - Calls `loadFromStorage()` on client initialization but constructor runs on server
  - SSR race condition if component renders before `initializeOnClient()` is called
  - Debounced save (1s) means rapid edits may lose words on page close
  - No versioning for schema changes
- Safe modification:
  - Ensure `initializeOnClient()` is called in root layout before first render
  - Consider localStorage quota exceeded errors (adds ~5KB per 1000 words)
  - Test localStorage access timing
- Test coverage: None

**BanglaInputHandler Context State:**
- Files: `src/lib/bangla-input-handler.ts` (lines 15, 87-100)
- Why fragile:
  - Singleton maintains `context` string between key presses
  - If input handler is disabled/enabled mid-word, context is reset (line 39)
  - No bounds on context string length (could accumulate chars if bug prevents clearing)
- Safe modification:
  - Add max context length check
  - Test enable/disable while typing
  - Clear context on any error condition
- Test coverage: None

**Text Position Calculations in Ghost Text:**
- Files: `src/components/note/ghost-text.tsx`, `src/components/note/index.tsx` (lines 354-368)
- Why fragile:
  - Multiple places calculate "current word" by searching backwards from cursor for `/[\s\.,;!?।]/`
  - Pattern doesn't include all Bangla punctuation
  - Cursor position assumptions don't account for IME composition (Korean/Japanese input methods would break)
- Safe modification:
  - Extract word boundary detection to shared utility
  - Add comprehensive Bangla punctuation pattern
  - Test with various punctuation marks
  - Document assumptions about cursor position
- Test coverage: None

## Scaling Limits

**localStorage Quota:**
- Current capacity: Browser localStorage typically 5-10MB
- Limit: With 5000-word learned words (~50-100KB) + word frequency data (~30KB) + notes collection (~varies), remaining space is ~4.9MB
- Current usage: Approx 150-200KB with ~1000 words + 10 notes
- Scaling path:
  - At 50+ notes of 10KB each + 5000 learned words = >700KB consumed
  - At 100+ notes, will approach 1-2MB
  - Above 2MB total: Consider IndexedDB for unlimited storage
  - Implement quota management: delete old notes, limit learned words

**Dictionary Rebuild Performance:**
- Current: ~5000 word dictionary rebuilt on every `getSuggestions()` call
- Limit: At 10K+ words, sorting becomes noticeable (>50ms for sort + search)
- Scaling path:
  - Implement lazy sorting or cached index
  - Use Web Worker for background sorting
  - Switch to trie or B-tree data structure for O(k) prefix matching

**Note List Rendering:**
- Current: Linear search through notes, re-render all on any change
- Limit: With 100+ notes, sidebar becomes slow
- Scaling path:
  - Implement virtual scrolling (windowing)
  - Index notes by date/title for search
  - Lazy-load note previews

## Dependencies at Risk

**lodash.debounce & lodash.throttle:**
- Risk: Micro-libraries for single utility functions; could be replaced with native implementations
- Impact: Adds 30KB to bundle
- Migration plan:
  - `useDebounce` hook already wraps lodash - replace with native setTimeout
  - Replace `lodash.throttle` usage in `use-notes.ts` line 2 with manual throttle wrapper
  - Remove dependencies after migration

**@ai-sdk/openai and ai packages:**
- Risk: API wrapper around OpenAI; if OpenAI API changes, package may lag
- Current usage: Only for spell-check fallback
- Impact: If not updated, spell-check API calls may fail
- Recommendation: Monitor releases quarterly, test spell-check on major version bumps

**Puppeteer in devDependencies:**
- Risk: Listed as devDependency but large package (200MB+ installed)
- Impact: Slows npm install; unclear if used in build
- Recommendation: Verify if test-*.js files in root are actually run in CI. If not, remove from package.json

## Missing Critical Features

**Error Recovery for localStorage Quota Exceeded:**
- Problem: If localStorage quota is exceeded, `saveToStorage()` silently fails (caught in try/catch)
- Blocks: Users lose learned words and note data when quota exceeded
- Fix: Implement quota exceeded handler that either:
  - Deletes oldest learned words until save succeeds
  - Prompts user to export notes before quota filled
  - Logs clear error to console

**No Offline Support:**
- Problem: All notes saved to localStorage, but ServiceWorker or offline fallback not implemented
- Blocks: Users can edit notes offline (works), but no sync when back online if using multiple devices
- Fix: Add service worker cache strategy (not required for MVP)

**No Data Export/Import:**
- Problem: Notes trapped in localStorage; no way to backup or migrate devices
- Blocks: Users lose all notes if browser data is cleared or device dies
- Fix: Add "Export as JSON" / "Import from JSON" feature

**No Collaborative Features:**
- Problem: Single-user only; no sharing or real-time collaboration
- Note: Out of scope for current MVP

## Test Coverage Gaps

**Phonetic Conversion Logic (HIGH PRIORITY):**
- What's not tested: `BanglaInputHandler.processInputKeyPress()` and context pattern matching
- Files: `src/lib/bangla-input-handler.ts`, `src/lib/context-pattern.ts`
- Risk: Phonetic conversion is core feature; bugs here break app usability
- Test cases needed:
  - Basic conversions: "a" → "আ", "ami" → "আমি"
  - Context patterns: "sho" → "শো" (correct form) not "শো"
  - Backspace handling: "ami" then backspace "i" → should be "am" not keep "ami"
  - Cursor position after conversion
  - Edge cases: Empty input, special characters, rapid key presses

**Spell Check Accuracy (HIGH PRIORITY):**
- What's not tested: `local-spell-checker.ts` Levenshtein distance and suggestion ranking
- Files: `src/lib/local-spell-checker.ts` (255 lines)
- Risk: False positives/negatives in spell check reduce user trust
- Test cases needed:
  - Common misspellings → correct suggestions
  - Valid words not marked as errors
  - Confidence score threshold correctness
  - Position accuracy with repeated words

**Adaptive Dictionary Learning (MEDIUM PRIORITY):**
- What's not tested: `adaptiveDictionary.learnWord()`, frequency tracking, persistence
- Files: `src/lib/adaptive-dictionary.ts`
- Risk: Dictionary doesn't improve over time if learning is broken
- Test cases needed:
  - Word frequency increments correctly
  - localStorage save/load preserves learned words
  - Suggestions ranked by frequency
  - Max word limit (5000) enforced

**React Component Integration (MEDIUM PRIORITY):**
- What's not tested: Interaction between NoteComponent, spell check, ghost text, input handler
- Files: `src/components/note/index.tsx`
- Risk: UI bugs like position mismatches, race conditions, state inconsistencies
- Test cases needed:
  - Ghost text appears after typing word
  - Tab key accepts suggestion
  - Spell check correction updates cursor position
  - Spell check errors clear when text changes
  - Mode toggle (Bangla/English) resets state correctly

**API Error Handling (MEDIUM PRIORITY):**
- What's not tested: `src/app/api/suggestions/route.ts` error paths
- Files: `src/app/api/suggestions/route.ts` (lines 79-90)
- Risk: Malformed API responses or network errors not handled gracefully
- Test cases needed:
  - Invalid JSON response from OpenAI
  - API timeout
  - Missing OPENAI_API_KEY
  - Rate limit hit

## Code Quality Observations

**Positive:**
- Good SSR awareness (checks `typeof window` before localStorage access)
- Proper cleanup in useEffect hooks
- Debouncing/throttling for performance
- Try/catch error handling for critical operations
- Reasonable separation of concerns (hooks, components, libraries)

**Areas for Improvement:**
- No input validation (use Zod schemas already imported)
- Heavy reliance on console.log for debugging instead of structured logging
- Some utility functions duplicated (word boundary detection appears 3+ times)
- Comments are sparse; complex algorithms lack explanation

---

*Concerns audit: 2026-03-27*
