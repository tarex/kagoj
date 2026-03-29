# CLAUDE.md

## Project

কাগজ -- সহজে বাংলা লিখুন. Next.js app for Bangla writing. Uses phonetic transliteration (type English keys, see native Bangla characters instantly -- no romanized text on screen). Not strictly Avro -- uses its own context-aware rules. Includes adaptive dictionary learning, AI ghost text suggestions, and spell-checking (currently paused).

## Commands

```bash
pnpm install          # install deps (pnpm only, not npm)
pnpm dev              # dev server with Turbopack
npx tsc --noEmit      # typecheck -- run after every change
```

- Do not run `pnpm build` during development.

## Architecture

- **Entry point**: `src/components/note/index.tsx` -- orchestrates everything
- **Input**: `src/lib/bangla-input-handler.ts` (singleton) -> `src/lib/context-pattern.ts` (100+ transliteration rules)
- **Dictionary**: 3-tier -- adaptive (localStorage, 5000 cap) > extended (comprehensive, 50k+) > base (collocations/bigrams)
- **Suggestions**: ghost text via trie lookup + bigram context; AI phrase completion via `/api/suggestions` (OpenAI, rate-limited, cached with LRU)
- **Spell-check** (paused): local Levenshtein-based (`src/lib/local-spell-checker.ts`), AI fallback via `/api/suggestions` -- overlay disabled, needs rethink
- **Typing guide**: `src/components/note/keyboard-shortcuts-panel.tsx` -- tabbed modal with searchable character mapping + keyboard shortcuts
- **PWA**: service worker (`public/sw.js`), offline-capable, installable
- **Persistence**: all localStorage -- notes, learned words, frequency, font size, theme

## Tech Stack

- Next.js 16 / React 19 / TypeScript 5.9 strict / Tailwind CSS 4
- Vercel AI SDK v6 (`@ai-sdk/openai` v3) -- uses `openai.chat()` for Chat Completions API
- Zod 4, lodash.debounce/throttle

## Key Files

```
src/
  app/
    api/suggestions/route.ts   # AI ghost text endpoint
    console-greeting.tsx       # Console easter egg
    layout.tsx                 # Root layout, fonts, metadata
    pwa-register.tsx           # Service worker registration
    globals.css                # All styles (no CSS modules)
  components/note/
    index.tsx                  # Main orchestrator
    keyboard-shortcuts-panel.tsx  # Typing guide + shortcuts modal
    note-editor.tsx            # Textarea
    ghost-text.tsx             # Word completion overlay
    toolbar.tsx                # Formatting toolbar
    note-list.tsx              # Sidebar note list
    onboarding.tsx             # First-use onboarding
    share-preview-modal.tsx    # Share as image
    capture-frame.tsx          # Image capture frame
    word-suggestion-popup.tsx  # Word suggestion UI
  hooks/
    useAISuggestion.ts         # AI ghost text with LRU cache + rate limiting
    useSpellCheck.ts           # Spell-check hook (paused)
    useShareImage.ts           # Share/capture image
    useUndoRedo.ts             # Undo/redo history
    useDebounce.ts             # Debounce utility
  lib/
    bangla-input-handler.ts    # Phonetic input processor (singleton)
    context-pattern.ts         # Transliteration rules
    adaptive-dictionary.ts     # Learns from user writing (singleton)
    trie.ts                    # Trie data structure for suggestions
    bigram-store.ts            # Bigram-based word prediction
    bangla-collocations.ts     # Pre-seeded word pairs
    bangla-words-comprehensive.ts  # 50k+ word dictionary
    local-spell-checker.ts     # Levenshtein spell-checker
    lru-cache.ts               # LRU cache for AI suggestions
```

## Rules

- TypeScript strict, no `any`
- `OPENAI_API_KEY` env var required for AI features (app works without it)
- Singletons: BanglaInputHandler, AdaptiveDictionary
- All state persists to localStorage -- never break existing keys
- All styles in `globals.css` -- no CSS modules, no inline style objects for layout
