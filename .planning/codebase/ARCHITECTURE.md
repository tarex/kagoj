# Architecture

**Analysis Date:** 2026-03-27

## Pattern Overview

**Overall:** Client-centric, single-page MVC architecture with layered separation of concerns

**Key Characteristics:**
- Next.js App Router with client-side state management
- Singleton input handler for Bangla phonetic conversion
- Custom React hooks for domain logic abstraction
- Reactive note management with localStorage persistence
- Adaptive dictionary learning from user input
- Layered library architecture for text processing and suggestions

## Layers

**Presentation Layer:**
- Purpose: React components handling UI rendering and user interactions
- Location: `src/components/note/`
- Contains: React components, toolbar, editors, overlays
- Depends on: Custom hooks (`useNotes`, `useSpellCheck`), input handler, dictionaries
- Used by: `src/app/page.tsx` (entry point)

**State Management Layer:**
- Purpose: Custom hooks managing notes, spell check, and debounced operations
- Location: `src/hooks/` and `src/components/note/use-notes.ts`
- Contains: `useNotes` hook (note CRUD), `useSpellCheck` hook (spell check state), `useDebounce` hook (debounced callbacks)
- Depends on: localStorage, lodash utilities
- Used by: NoteComponent and other presentation layer components

**Business Logic / Input Processing Layer:**
- Purpose: Phonetic input conversion and text processing
- Location: `src/lib/bangla-input-handler.ts`, `src/lib/local-spell-checker.ts`, `src/lib/adaptive-dictionary.ts`
- Contains: Transliteration engine, spell checking, word frequency tracking
- Depends on: Context patterns, dictionary data
- Used by: Presentation layer via hooks and direct imports

**Data/Dictionary Layer:**
- Purpose: Bangla language dictionaries and word data
- Location: `src/lib/bangla-dictionary.ts`, `src/lib/bangla-words-extended.ts`, `src/lib/adaptive-dictionary.ts`
- Contains: Base dictionary, extended word lists, learned words, frequency maps
- Depends on: localStorage (adaptive dictionary)
- Used by: Input handler, spell checker, suggestion engine

**API Layer:**
- Purpose: External service integration (OpenAI for spell checking)
- Location: `src/app/api/suggestions/route.ts`
- Contains: POST endpoint for spell check requests
- Depends on: OpenAI SDK (`ai`, `@ai-sdk/openai`)
- Used by: Presentation layer via fetch calls

**Configuration Layer:**
- Purpose: Transliteration rules and patterns
- Location: `src/lib/context-pattern.ts`
- Contains: 100+ regex-based transliteration rules with context awareness
- Depends on: None
- Used by: BanglaInputHandler for character conversion

## Data Flow

**Text Input → Bangla Conversion:**

1. User types in textarea → `NoteComponent.handleKeyPress()`
2. Bangla mode active → `BanglaInputHandler.getInstance().processInputKeyPress()`
3. Input handler retrieves last N characters from context for pattern matching
4. `transliterate()` applies rules from `contextPatterns` to convert English to Bangla
5. Cursor position recalculated and textarea updated with converted text
6. Component state updates via `setCurrentNote()`

**Text Suggestion Flow:**

1. User finishes typing a word → `NoteComponent.handleInput()`
2. Extract current word from cursor position
3. Call `adaptiveDictionary.getSuggestions(word)`
4. Returns matching words sorted by frequency (most used first)
5. Display first suggestion as ghost text via `GhostText` component
6. Tab key accepts → word inserted, dictionary learns the completed word

**Spell Checking Flow:**

1. User manually triggers spell check or text changes with errors showing
2. `useSpellCheck.checkSpelling()` called with full text
3. Local spell check via `localCheckSpelling()` returns errors with positions
4. (Fallback) OpenAI API call to `POST /api/suggestions` if needed
5. `SpellingOverlay` renders red underlines at error positions
6. User clicks correction → `handleSpellingCorrection()` replaces word and updates dictionary
7. Spell check errors cleared when no matches remain

**Note Persistence:**

1. User edits current note → `handleChange()` updates state
2. Auto-save timeout (2s) triggers → `saveCurrentNote()`
3. `useNotes.saveCurrentNote()` updates notes array
4. Throttled save to localStorage (1s) via `useNotes.saveNotes()`
5. Current unsaved note also saved to `currentNote` in localStorage
6. On app reload → `useNotes` effect reloads notes and current note from storage

**Dictionary Learning:**

1. User types text or accepts suggestions
2. Parallel flows:
   - On word boundary (space/punctuation): Extract word → `adaptiveDictionary.learnWord()`
   - On timer (30s): Full text → `adaptiveDictionary.learnFromText()`
   - On suggestion acceptance: Complete word → `adaptiveDictionary.learnWord()`
3. Dictionary checks: Is Bangla? Not in base dictionary? → Add to learned words
4. Frequency tracking incremented
5. Debounced save to localStorage (1s) prevents excessive writes

**State Management:**

- **Notes array**: Managed by `useNotes` hook, persisted in localStorage
- **Current note**: Dual storage — in React state and localStorage (for recovery)
- **Selected note index**: Tracks which note is being edited
- **Bangla mode**: React state, toggled by Ctrl+Shift+B
- **Font size & theme**: localStorage with React state sync on mount
- **Ghost suggestion**: React state, cleared on word boundaries or Escape
- **Spelling errors**: `useSpellCheck` state, array of error objects with positions
- **Learned words**: Singleton `adaptiveDictionary`, persisted in localStorage

## Key Abstractions

**BanglaInputHandler (Singleton):**
- Purpose: Isolates complex transliteration logic from UI
- Examples: `src/lib/bangla-input-handler.ts`
- Pattern: Singleton with public static `getInstance()`, private constructor
- Methods: `processInputKeyPress()` (main entry), `enable()/disable()`, `transliterate()`, `updateContext()`
- Benefits: Single instance shared across app, stateful context maintained, testable input processing

**AdaptiveDictionary (Singleton):**
- Purpose: Centralizes word learning and suggestion logic
- Examples: `src/lib/adaptive-dictionary.ts`
- Pattern: Singleton instance exported as module constant
- Methods: `learnWord()`, `learnFromText()`, `getSuggestions()`, `replaceWord()`, `clearLearnedWords()`
- Benefits: Persistent frequency tracking, efficient suggestion ranking, learning from user patterns

**useNotes Custom Hook:**
- Purpose: Encapsulates note CRUD and persistence
- Examples: `src/components/note/use-notes.ts`
- Pattern: React hook returning object with state and callbacks
- Methods: `createNewNote()`, `selectNote()`, `deleteNote()`, `saveCurrentNote()`, `setCurrentNote()`
- Benefits: Reusable note management, localStorage abstraction, throttled saves

**useSpellCheck Custom Hook:**
- Purpose: Manages spell checking state and operations
- Examples: `src/hooks/useSpellCheck.ts`
- Pattern: React hook returning state and callback functions
- Methods: `checkSpelling()`, `handleSpellingCorrection()`, `handleIgnoreSpelling()`, `scheduleSpellCheck()`
- Benefits: Spell check decoupled from UI, error position tracking, dictionary integration

**useDebounce Custom Hook:**
- Purpose: Wraps functions with debounce logic
- Examples: `src/hooks/useDebounce.ts`
- Pattern: Generic hook using lodash debounce internally
- Usage: `updateGhostSuggestion = useDebounce(updateGhostSuggestionInternal, 150)`
- Benefits: Prevents excessive function calls during rapid input

## Entry Points

**Next.js App Entry:**
- Location: `src/app/layout.tsx`
- Triggers: Server-side rendering, font imports
- Responsibilities: HTML structure, font setup, metadata

**Page Component:**
- Location: `src/app/page.tsx`
- Triggers: Client-side navigation to `/`
- Responsibilities: 'use client' directive, mounts NoteComponent

**Main Application Component:**
- Location: `src/components/note/index.tsx`
- Triggers: Page render
- Responsibilities: Orchestrates all child components, manages all state hooks, handles keyboard shortcuts, coordinates input/suggestion/spell check flows

**API Entry:**
- Location: `src/app/api/suggestions/route.ts`
- Triggers: POST requests from client
- Responsibilities: Spell checking via OpenAI, error position calculation

## Error Handling

**Strategy:** Try-catch blocks at layer boundaries with fallback to defaults

**Patterns:**
- `useNotes`: Catches JSON parse errors, defaults to empty notes array
- `adaptiveDictionary`: Catches localStorage errors silently, continues with in-memory data
- `useSpellCheck`: Catches spell check API errors, logs but doesn't crash UI
- `BanglaInputHandler`: No explicit error handling (input validation assumes valid DOM ref)
- API route: Catches parse errors, returns empty errors array on failure

## Cross-Cutting Concerns

**Logging:**
- Ad-hoc console.log for debugging (learning, spell check, correction steps)
- No centralized logging framework
- Logs prefixed with emoji for visibility (🔍, ✅, ❌)

**Validation:**
- Text length checks (min 2-3 chars for learning/suggestions)
- Bangla character detection via regex `/[\u0980-\u09FF]/`
- Cursor position validation in error correction
- localStorage error handling with try-catch

**Authentication:**
- None implemented
- OpenAI API key via environment variable `OPENAI_API_KEY`
- No per-user authentication, single-user application

**Persistence:**
- localStorage for notes, learned words, frequency tracking
- Throttled writes to prevent excessive storage operations
- Size limits: MAX_LEARNED_WORDS = 5000 to prevent bloat
- SSR-safe: Checks `typeof window !== 'undefined'` before localStorage access

---

*Architecture analysis: 2026-03-27*
