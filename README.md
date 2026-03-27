# kagoj

<h1 align="center">বাংলা AI Notebook</h1>

<p align="center">
  <strong>A modern, offline-first Bangla writing app with phonetic typing, AI spell-checking, and adaptive learning.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript" alt="TypeScript 5.9" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
</p>

<p align="center">
  <a href="#features">Features</a> &bull;
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="#how-it-works">How It Works</a> &bull;
  <a href="#keyboard-shortcuts">Shortcuts</a> &bull;
  <a href="#architecture">Architecture</a> &bull;
  <a href="#contributing">Contributing</a>
</p>

---

## Why?

Writing Bangla on a computer shouldn't require installing special keyboard software or memorizing complex layouts. **বাংলা AI Notebook** lets you type Bangla using regular English keys — just type how it sounds, and the app converts it instantly.

```
ami banglay gan gai  →  আমি বাংলায় গান গাই
```

No server required. No account needed. Everything runs in your browser.

---

## Features

### Phonetic Typing (Avro-style)

Type Romanized Bangla and see instant Bangla output. No English letters shown during typing — direct conversion as you type.

- **100+ transliteration rules** with context-aware pattern matching
- Supports complex conjuncts (`ক্ষ`, `জ্ঞ`, `ষ্ট`) and special characters
- Seamless toggle between Bangla and English modes

### Smart Spell-Checking

```
┌─────────────────────────────────────┐
│  আমি বাংলায় গান গাি               │
│                   ~~~~              │
│              ┌──────────┐           │
│              │ গাই  Fix │           │
│              │   Ignore │           │
│              └──────────┘           │
└─────────────────────────────────────┘
```

- **Local-first** — Levenshtein distance algorithm with confidence scoring
- **AI fallback** — Optional OpenAI integration for harder cases
- Wavy underline on errors with one-click Fix / Ignore
- Low-confidence errors (< 50%) are automatically filtered out

### Adaptive Dictionary

The app learns from your writing and gets smarter over time.

```
You type "প্রোগ্রামিং" frequently
     ↓
Dictionary learns it → ranks it higher → suggests it faster
```

- **Three-tier lookup**: learned words → extended dictionary (5,000+) → base dictionary (300)
- Frequency tracking — commonly used words rank higher in suggestions
- Persists to localStorage with a 5,000-word cap

### Ghost Text Suggestions

Translucent word completions appear as you type. Press **Tab** to accept, **Escape** to dismiss.

### Notes Management

- Multiple notes with sidebar navigation
- Auto-save every 2 seconds
- Dark / light theme toggle
- Adjustable font size
- All data stored locally in your browser

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18.18+
- [pnpm](https://pnpm.io/) (package manager)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/AKTareq/bangla-notebook.git
cd bangla-notebook

# Install dependencies
pnpm install

# Start development server (Turbopack)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and start writing.

### Environment Variables (Optional)

AI spell-checking is **optional**. The app works fully offline with the local spell-checker.

```bash
cp .env.example .env.local
```

| Variable         | Required | Description                                |
| ---------------- | -------- | ------------------------------------------ |
| `OPENAI_API_KEY` | No       | Enables AI-powered spell-checking fallback |

---

## How It Works

```
┌──────────────────────────────────────────────────────────┐
│                      User Types                          │
│                    "ami banglay"                          │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   BanglaInputHandler     │    │   Adaptive Dictionary    │
│                          │    │                          │
│  Phonetic → Bangla       │───▶│  Learn word on boundary  │
│  "ami" → "আমি"           │    │  Track frequency         │
│  Context-aware rules     │    │  Suggest completions     │
└──────────────────────────┘    └──────────────────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   Spell Checker          │    │   Ghost Text             │
│                          │    │                          │
│  Local (Levenshtein)     │    │  Faded word completion   │
│  AI fallback (optional)  │    │  Tab to accept           │
│  Confidence filtering    │    │  Dictionary-powered      │
└──────────────────────────┘    └──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│                   SpellingOverlay                         │
│            Wavy underlines + Fix/Ignore popup             │
└──────────────────────────────────────────────────────────┘
```

---

## Keyboard Shortcuts

| Shortcut                                      | Action                       |
| --------------------------------------------- | ---------------------------- |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> | Toggle Bangla / English mode |
| <kbd>Tab</kbd>                                | Accept ghost text suggestion |
| <kbd>Escape</kbd>                             | Dismiss ghost suggestion     |
| <kbd>Ctrl</kbd>+<kbd>B</kbd>                  | Bold                         |
| <kbd>Ctrl</kbd>+<kbd>I</kbd>                  | Italic                       |
| <kbd>Ctrl</kbd>+<kbd>U</kbd>                  | Underline                    |
| <kbd>Ctrl</kbd>+<kbd>D</kbd>                  | Strikethrough                |
| <kbd>Ctrl</kbd>+<kbd>E</kbd>                  | Code                         |
| <kbd>Ctrl</kbd>+<kbd>H</kbd>                  | Highlight                    |

---

## Architecture

### Tech Stack

| Layer      | Technology                             |
| ---------- | -------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack)     |
| UI         | React 19, Tailwind CSS 4               |
| Language   | TypeScript 5.9 (strict mode)           |
| AI         | Vercel AI SDK v6, OpenAI GPT-3.5-turbo |
| Validation | Zod 4                                  |
| Testing    | Puppeteer (E2E)                        |

### Project Structure

```
src/
├── app/
│   ├── api/suggestions/    # AI spell-check API endpoint
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
│
├── components/note/
│   ├── index.tsx           # Main orchestrator component
│   ├── note-editor.tsx     # Memoized textarea
│   ├── ghost-text.tsx      # Word completion overlay
│   ├── spelling-overlay.tsx# Spell-check error display
│   ├── toolbar.tsx         # Formatting buttons
│   ├── note-list.tsx       # Sidebar note list
│   ├── autocomplete.tsx    # Autocomplete dropdown
│   └── use-notes.ts        # Notes CRUD hook
│
├── hooks/
│   ├── useSpellCheck.ts    # Spell-checking integration
│   └── useDebounce.ts      # Generic debounce hook
│
└── lib/
    ├── bangla-input-handler.ts   # Phonetic input processor
    ├── context-pattern.ts        # 100+ transliteration rules
    ├── local-spell-checker.ts    # Levenshtein spell checker
    ├── adaptive-dictionary.ts    # Learning dictionary
    ├── bangla-dictionary.ts      # Base dictionary (~300 words)
    └── bangla-words-extended.ts  # Extended dictionary (~5,000+ words)

tests/                      # Puppeteer E2E test scripts
```

### Key Design Decisions

- **Offline-first** — No server dependency for core functionality
- **Singleton pattern** — BanglaInputHandler and AdaptiveDictionary are singletons for consistent state
- **Three-tier dictionary** — Adaptive → Extended → Base, with frequency-weighted ranking
- **Confidence-based filtering** — Spell-check errors below 50% confidence are suppressed to reduce noise
- **Throttled persistence** — Saves and spell-checks are debounced/throttled to keep typing smooth

---

## Data Storage

All data lives in your browser's `localStorage`. Nothing is sent to any server (unless you enable the optional AI spell-check).

| Key                     | Contents                  |
| ----------------------- | ------------------------- |
| `notes`                 | Saved notes array         |
| `currentNote`           | Unsaved draft             |
| `noteFontSize`          | Font size preference      |
| `noteTheme`             | Dark / light theme        |
| `bangla_learned_words`  | Adaptive dictionary words |
| `bangla_word_frequency` | Word frequency map        |

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create a branch** — `git checkout -b feature/my-feature`
3. **Make your changes** and ensure `pnpm lint` passes
4. **Commit** with a descriptive message
5. **Open a Pull Request**

### Priority Areas

- Expanding the base and extended dictionaries
- Improving transliteration rules for edge cases
- Adding formal test coverage (Jest / Vitest)
- Mobile responsiveness improvements
- Bangla voice input support

---

## License

MIT &copy; [Tareq](https://github.com/AKTareq)

---

<p align="center">
  <sub>Built with ❤️ for the Bangla-speaking community</sub>
</p>
