# Codebase Structure

**Analysis Date:** 2026-03-27

## Directory Layout

```
notebook/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with fonts
│   │   ├── page.tsx            # Home page (mounts NoteComponent)
│   │   ├── api/
│   │   │   └── suggestions/
│   │   │       └── route.ts    # POST /api/suggestions (spell check)
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   └── note/               # Note-taking feature components
│   │       ├── index.tsx       # Main orchestrator component
│   │       ├── note-editor.tsx # Textarea wrapper
│   │       ├── note-list.tsx   # Sidebar note list
│   │       ├── toolbar.tsx     # Text formatting toolbar
│   │       ├── ghost-text.tsx  # Floating suggestion text
│   │       ├── spelling-overlay.tsx  # Error underlines overlay
│   │       ├── autocomplete.tsx # Autocomplete suggestions (legacy)
│   │       ├── debug-panel.tsx # Debug information panel
│   │       └── use-notes.ts    # Note management hook
│   ├── hooks/
│   │   ├── useSpellCheck.ts    # Spell checking state and logic
│   │   └── useDebounce.ts      # Generic debounce hook
│   └── lib/
│       ├── bangla-input-handler.ts      # Phonetic input converter (singleton)
│       ├── context-pattern.ts           # 100+ transliteration rules
│       ├── adaptive-dictionary.ts       # Word learning & suggestions
│       ├── bangla-dictionary.ts         # Base Bangla word list
│       ├── bangla-words-extended.ts     # Extended word list
│       ├── local-spell-checker.ts       # Offline spell checking
│       └── bangla-suggestion.ts         # AI suggestion integration (legacy)
├── public/                     # Static assets
├── .planning/
│   └── codebase/              # Analysis documents (this folder)
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies
└── pnpm-lock.yaml            # Lockfile
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router pages and API routes
- Contains: Server and client components, route handlers
- Key files: `layout.tsx` (metadata, fonts), `page.tsx` (entry), `api/suggestions/route.ts` (API endpoint)

**`src/components/note/`:**
- Purpose: All note-taking application UI and state management
- Contains: React components (textarea, toolbar, overlays), custom hook for note CRUD
- Key files: `index.tsx` (main orchestrator), `use-notes.ts` (state management), `toolbar.tsx`, `note-editor.tsx`

**`src/hooks/`:**
- Purpose: Reusable React hooks for cross-cutting concerns
- Contains: Custom hooks for spell check, debouncing
- Key files: `useSpellCheck.ts`, `useDebounce.ts`

**`src/lib/`:**
- Purpose: Core business logic, text processing, and data
- Contains: Bangla input conversion, dictionaries, spell checking, suggestions
- Key files: `bangla-input-handler.ts` (main input logic), `context-pattern.ts` (rules), `adaptive-dictionary.ts` (learning)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Server-side root layout, imports fonts, sets metadata
- `src/app/page.tsx`: Client component that mounts `NoteComponent`
- `src/components/note/index.tsx`: Main application orchestrator (handles all state and logic)

**Configuration:**
- `next.config.ts`: Next.js framework config (minimal)
- `tailwind.config.ts`: Tailwind CSS classes
- `tsconfig.json`: TypeScript strict mode settings

**Core Logic:**
- `src/lib/bangla-input-handler.ts`: Singleton managing phonetic input conversion with 100+ rules
- `src/lib/context-pattern.ts`: 319 lines of transliteration pattern definitions
- `src/lib/adaptive-dictionary.ts`: Word learning, frequency tracking, suggestion ranking

**UI Components:**
- `src/components/note/index.tsx`: 580 lines, main component coordinating all features
- `src/components/note/toolbar.tsx`: Formatting buttons (bold, italic, etc.)
- `src/components/note/note-editor.tsx`: Textarea wrapper with ref management
- `src/components/note/ghost-text.tsx`: Floating suggestion display with scroll sync
- `src/components/note/spelling-overlay.tsx`: Red underlines for spelling errors
- `src/components/note/note-list.tsx`: Sidebar with note list and selection

**Hooks & Utilities:**
- `src/components/note/use-notes.ts`: Note CRUD, localStorage persistence, auto-save
- `src/hooks/useSpellCheck.ts`: Spell check state, error management, corrections
- `src/hooks/useDebounce.ts`: Debounce wrapper around lodash

**Data:**
- `src/lib/bangla-dictionary.ts`: Base Bangla words
- `src/lib/bangla-words-extended.ts`: Extended word list
- `src/lib/local-spell-checker.ts`: Offline spell checking logic

**API:**
- `src/app/api/suggestions/route.ts`: POST endpoint for OpenAI spell checking

**Styling:**
- `src/app/globals.css`: All application styles (dark mode, layout, components)

## Naming Conventions

**Files:**
- React components: PascalCase with `.tsx` extension (`NoteEditor.tsx`, `GhostText.tsx`)
- Hooks: camelCase with `use` prefix and `.ts` extension (`useSpellCheck.ts`, `useDebounce.ts`)
- Utilities/libraries: camelCase with `.ts` extension (`bangla-input-handler.ts`, `adaptive-dictionary.ts`)
- API routes: `route.ts` in `api/[feature]/` directories
- Styles: `globals.css` for global, component styles inline or in globals.css
- Data files: descriptive names (`bangla-dictionary.ts`, `context-pattern.ts`)

**Directories:**
- Feature directories: lowercase (`components/note/`, `src/lib/`)
- API routes: snake-case (`api/suggestions/`)
- Non-component utilities: `lib/` folder
- Hooks: `hooks/` folder

**Functions & Variables:**
- Components: PascalCase (`NoteComponent`, `NoteEditor`)
- Hooks: camelCase with `use` prefix (`useNotes`, `useSpellCheck`)
- Instances/exports: camelCase (`banglaInputHandler`, `adaptiveDictionary`)
- State setters: `set{Property}` pattern (`setCurrentNote`, `setIsBanglaMode`)
- Event handlers: `handle{Event}` pattern (`handleKeyPress`, `handleChange`)
- Constants: UPPER_CASE (`DEFAULT_FONT_SIZE`, `SAVE_THROTTLE_TIME`, `MAX_LEARNED_WORDS`)

**Types & Interfaces:**
- Interfaces: PascalCase with `Props` suffix for component props (`NoteEditorProps`, `ToolbarProps`)
- Interfaces for data: Descriptive names (`Note`, `SpellingError`, `TransliterationRule`)

## Where to Add New Code

**New Feature:**
- Primary code: `src/components/note/` if UI-heavy, `src/lib/` if logic-heavy
- Tests: Co-located with implementation (when testing framework added)
- Example: New suggestion provider → `src/lib/suggestion-{name}.ts` + usage in `src/components/note/index.tsx`

**New Component/Module:**
- Implementation: `src/components/note/` for UI, `src/lib/` for utilities
- Styling: Add classes to `src/app/globals.css`
- Example: Sidebar settings panel → Create `src/components/note/settings-panel.tsx`, add CSS, import in `index.tsx`

**Utilities:**
- Shared helpers: `src/lib/` with descriptive names
- Format: Single-responsibility files (one main export)
- Example: URL helper → `src/lib/url-helpers.ts`

**Custom Hooks:**
- Location: `src/hooks/` for general-purpose, `src/components/note/use-{feature}.ts` for feature-specific
- Pattern: Export named hook, handle cleanup
- Example: Note drag-and-drop → `src/components/note/useNoteDnd.ts`

**Dictionary/Data:**
- Location: `src/lib/` with clear naming
- Format: Exported constant arrays or objects
- Example: New language dictionary → `src/lib/english-dictionary.ts`

**API Routes:**
- Location: `src/app/api/{feature}/route.ts`
- Pattern: Export named async functions (GET, POST, etc.)
- Example: Note export endpoint → `src/app/api/notes/export/route.ts`

## Special Directories

**`public/`:**
- Purpose: Static assets served at root URL
- Generated: No
- Committed: Yes
- Usage: Images, fonts (Google Fonts imported in layout, not from here)

**`.next/`:**
- Purpose: Next.js build output and type definitions
- Generated: Yes (by `pnpm build` or dev server)
- Committed: No (in .gitignore)

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes (by `pnpm install`)
- Committed: No (in .gitignore)

**`.planning/codebase/`:**
- Purpose: Architecture and codebase analysis documents
- Generated: By GSD map-codebase command
- Committed: Yes
- Contents: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, STACK.md, INTEGRATIONS.md, CONCERNS.md

## File Relationship Map

**Component → Hook → Library Flow:**

```
NoteComponent (index.tsx)
├── useNotes() → localStorage note CRUD
├── useSpellCheck() → localCheckSpelling() + OpenAI API
│   └── adaptiveDictionary.replaceWord()
├── useDebounce() → lodash.debounce wrapper
├── BanglaInputHandler.getInstance()
│   └── contextPatterns (100+ rules)
└── adaptiveDictionary.getSuggestions()
    └── bangla-dictionary + learned words
```

**Render → Edit → Save Flow:**

```
NoteComponent renders
├── NoteEditor (textarea)
├── Toolbar (formatting buttons)
├── GhostText (floating suggestion)
├── SpellingOverlay (error underlines)
└── NoteList (sidebar)

On input:
handleKeyPress → BanglaInputHandler → setCurrentNote
handleChange → auto-learn + auto-save + spell check
handleInput → updateGhostSuggestion
```

---

*Structure analysis: 2026-03-27*
