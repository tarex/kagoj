# Bangla AI Notebook

A web-based Bangla writing application with Avro-style phonetic typing, AI-powered spell-checking, adaptive dictionary learning, and ghost text word suggestions.

## Getting Started

### Prerequisites

- **Node.js** 18.18+
- **pnpm** (package manager)

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd notebook

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your OpenAI API key to .env.local
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | For AI spell-check | OpenAI API key for AI-powered spell-checking fallback |

AI spell-checking is optional. The app works fully offline with the local spell-checker.

### Running

```bash
# Development (with Turbopack)
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint
```

The dev server runs at `http://localhost:3000`.

## Features

### Phonetic Typing (Avro-style)

Type in Romanized Bangla and see direct Bangla output. Example: typing `ami banglay gan gai` produces `আমি বাংলায় গান গাই`.

- 100+ transliteration rules with context-aware pattern matching
- Supports complex conjuncts and special characters
- No English letters shown during typing — direct Bangla conversion

### Spell-Checking

- **Local-first**: Uses Levenshtein distance algorithm with confidence scoring
- **AI fallback**: Optional OpenAI GPT-3.5-turbo for harder cases
- Wavy red underline on errors with Fix/Ignore popup
- Errors below 50% confidence are filtered out

### Adaptive Dictionary

- Learns words as you type (on space/punctuation boundaries)
- Three-tier lookup: learned words > extended dictionary (5000+) > base dictionary (300)
- Frequency tracking — commonly used words rank higher
- Persists to localStorage with a 5000-word cap

### Ghost Text Suggestions

- Shows faded word completion suggestions as you type
- Press `Tab` to accept, `Escape` to dismiss
- Powered by the adaptive dictionary

### Notes Management

- Multiple notes with sidebar navigation
- Auto-save every 2 seconds
- Dark/light theme toggle
- Adjustable font size

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+B` | Toggle Bangla/English mode |
| `Tab` | Accept ghost text suggestion |
| `Escape` | Dismiss ghost suggestion |
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+U` | Underline |
| `Ctrl+D` | Strikethrough |
| `Ctrl+E` | Code |
| `Ctrl+H` | Highlight |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript 5.9 (strict mode) |
| AI | Vercel AI SDK v6, OpenAI GPT-3.5-turbo |
| Validation | Zod 4 |
| Testing | Puppeteer (E2E scripts in root) |

## Project Structure

```
src/
  app/
    api/suggestions/route.ts   # AI spell-check API endpoint
    layout.tsx                  # Root layout
    page.tsx                    # Home page
    globals.css                 # Global styles

  components/note/
    index.tsx                   # Main orchestrator component
    note-editor.tsx             # Memoized textarea
    ghost-text.tsx              # Word completion overlay
    spelling-overlay.tsx        # Spell-check error display
    toolbar.tsx                 # Formatting buttons
    note-list.tsx               # Sidebar note list
    autocomplete.tsx            # Autocomplete dropdown
    use-notes.ts                # Notes CRUD hook

  hooks/
    useSpellCheck.ts            # Spell-checking integration
    useDebounce.ts              # Generic debounce hook

  lib/
    bangla-input-handler.ts     # Singleton phonetic input processor
    context-pattern.ts          # 100+ transliteration rules
    local-spell-checker.ts      # Levenshtein-based spell checker
    adaptive-dictionary.ts      # Learning dictionary with frequency tracking
    bangla-dictionary.ts        # Base dictionary (~300 words)
    bangla-words-extended.ts    # Extended dictionary (~5000+ words)
```

## Data Persistence

All data is stored in the browser's localStorage:

| Key | Contents |
|-----|----------|
| `notes` | Saved notes array |
| `currentNote` | Unsaved draft |
| `noteFontSize` | Font size preference |
| `noteTheme` | Dark/light theme |
| `bangla_learned_words` | Adaptive dictionary words |
| `bangla_word_frequency` | Word frequency map |
