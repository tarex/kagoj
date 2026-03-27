# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bangla AI Notebook - A Next.js 15 web application for writing Bangla text with AI-powered suggestions, local spell-checking, adaptive dictionary learning, and advanced Avro-style phonetic typing.

## Development Commands

```bash
# Install dependencies (use pnpm, not npm)
pnpm install

# Run development server with Turbopack
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

- Do not run `pnpm build` after code changes during development.

## Architecture Overview

### Core Components

- **NoteComponent** (`/src/components/note/index.tsx`): Main orchestrator - manages Bangla/English mode, spell-checking, ghost text suggestions, adaptive dictionary learning, theme, and font controls
- **NoteEditor** (`/src/components/note/note-editor.tsx`): Memoized textarea component
- **GhostText** (`/src/components/note/ghost-text.tsx`): Word completion overlay synced with textarea scroll
- **SpellingOverlay** (`/src/components/note/spelling-overlay.tsx`): Wavy underline error display with Fix/Ignore popup
- **Toolbar** (`/src/components/note/toolbar.tsx`): Text formatting buttons and spell-check toggle
- **NoteList** (`/src/components/note/note-list.tsx`): Sidebar with note previews, Bangla date locale (bn-BD)
- **Autocomplete** (`/src/components/note/autocomplete.tsx`): Autocomplete dropdown UI

### Core Libraries

- **BanglaInputHandler** (`/src/lib/bangla-input-handler.ts`): Singleton managing Avro-style phonetic input conversion with context-aware pattern matching
- **context-pattern.ts** (`/src/lib/context-pattern.ts`): 100+ transliteration rules mapping Roman keys to Bangla characters and conjuncts
- **local-spell-checker.ts** (`/src/lib/local-spell-checker.ts`): Local spell-checking engine using Levenshtein distance with confidence scoring
- **adaptive-dictionary.ts** (`/src/lib/adaptive-dictionary.ts`): Singleton learning dictionary - tracks word frequency, persists to localStorage, 5000-word limit
- **bangla-dictionary.ts** (`/src/lib/bangla-dictionary.ts`): Base dictionary (~300 common Bangla words)
- **bangla-words-extended.ts** (`/src/lib/bangla-words-extended.ts`): Extended dictionary (~5000+ words with verb conjugations)

### Hooks

- **useSpellCheck** (`/src/hooks/useSpellCheck.ts`): Spell-checking integration - uses local checker by default, filters low-confidence errors (<50%), handles corrections and dictionary learning
- **useDebounce** (`/src/hooks/useDebounce.ts`): Generic debounce wrapper with cleanup
- **useNotes** (`/src/components/note/use-notes.ts`): Note CRUD with localStorage persistence, throttled saves (1s), auto-save (2s)

### API Routes

- **POST /api/suggestions** (`/src/app/api/suggestions/route.ts`): AI spell-checking via OpenAI GPT-3.5-turbo with word position mapping. Falls back to local spell-checker. Accepts `text` and `mode` (default: 'spellcheck').

### Key Design Patterns

- Singleton pattern for BanglaInputHandler and AdaptiveDictionary
- Three-tier dictionary: adaptive (learned) > extended (5000+) > base (300)
- Local-first spell-checking with AI fallback
- Confidence-based error filtering using edit distance
- Throttled/debounced saves and spell-checks for performance
- localStorage persistence for notes, learned words, word frequency, font size, theme

### Data Flows

**Text Input:** User types -> BanglaInputHandler.processInputKeyPress() -> transliterate() with context patterns -> textarea update -> updateGhostSuggestion() via adaptive dictionary

**Spell-Check:** Text change -> scheduleSpellCheck() -> local-spell-checker with Levenshtein distance -> SpellingOverlay renders wavy underlines -> Fix/Ignore popup -> adaptive dictionary update

**Learning:** Word boundary (space/punctuation) -> adaptiveDictionary.learnWord() -> frequency update -> debounced localStorage save -> prioritized in future suggestions

## Keyboard Shortcuts

- `Ctrl+Shift+B` - Toggle Bangla/English mode
- `Tab` - Accept ghost text suggestion
- `Escape` - Dismiss ghost suggestion
- `Ctrl+B` - Bold
- `Ctrl+I` - Italic
- `Ctrl+U` - Underline
- `Ctrl+D` - Strikethrough
- `Ctrl+E` - Code
- `Ctrl+H` - Highlight

## localStorage Keys

- `notes` - Saved notes array
- `currentNote` - Unsaved draft
- `noteFontSize` - Font size preference
- `noteTheme` - Theme preference (dark/light)
- `bangla_learned_words` - Learned words set
- `bangla_word_frequency` - Word frequency map

## Environment Variables

Required for AI features:
- `OPENAI_API_KEY`: OpenAI API key for AI spell-checking fallback

## Tech Stack

- Next.js 16 with App Router and Turbopack
- React 19
- TypeScript 5.9 (strict, no `any`)
- Tailwind CSS 4
- Vercel AI SDK v6 (`@ai-sdk/openai` v3, `ai` v6) - uses `openai.chat()` for Chat Completions API
- Zod 4 for schema validation
- lodash.debounce / lodash.throttle

## Code Standards

- TypeScript strict mode, no `any`
- SOLID principles for classes
- Functions under 20 instructions
- PascalCase for classes, camelCase for variables/functions
- JSDoc for public methods

## Testing

No formal testing framework. Priority areas for future tests:
- Phonetic conversion logic in `bangla-input-handler.ts`
- Levenshtein distance and spell-check accuracy in `local-spell-checker.ts`
- Adaptive dictionary learning and persistence
- Test scripts exist in root (`test-*.js`) using Puppeteer for E2E
