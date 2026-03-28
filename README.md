<h1 align="center">কাগজ — সহজে বাংলা লিখুন</h1>

<p align="center">
  <strong>A modern, offline-first Bangla writing app where every keystroke produces native Bangla characters — no English letters on screen, ever.</strong>
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

Most phonetic Bangla tools show English letters on screen while you type, then convert them after you press space or confirm. **কাগজ** takes a different approach — every keystroke produces native Bangla characters directly. You never see romanized text. Just type how it sounds and Bangla appears instantly.

```
You press:  a  m  i  [space]  b  a  n  g  l  a  y
You see:    আ  ম  ি  [space]  ব  া  ং  ল  া  য়
```

No server required. No account needed. Your writing stays on your device — everything is saved to localStorage, never sent to any server. You own your text.

---

## Features

### Native Bangla Typing (Avro-style)

Type using your regular English keyboard and see Bangla characters appear immediately — no romanized text on screen, no conversion step. Each keystroke directly produces native Bangla output.

- **100+ transliteration rules** with context-aware pattern matching
- Supports complex conjuncts (`ক্ষ`, `জ্ঞ`, `ষ্ট`) and special characters
- Seamless toggle between Bangla and English modes

### Smart Spell-Checking (paused — being reworked)

Built-in spell checker with local Levenshtein matching and optional AI fallback. Currently disabled while the feature is being rethought for better accuracy.

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
git clone https://github.com/tarex/kagoj.git
cd kagoj

# Install dependencies
pnpm install

# Start development server (Turbopack)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and start writing.

### Environment Variables (Optional)

The app works fully offline. AI features require an API key but spell-checking is currently paused.

```bash
cp .env.example .env.local
```

| Variable         | Required | Description                                         |
| ---------------- | -------- | --------------------------------------------------- |
| `OPENAI_API_KEY` | No       | Enables AI-powered features (spell-check is paused) |

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
│  Keystroke → Bangla      │───▶│  Learn word on boundary  │
│  "a" → "আ", "m" → "ম"   │    │  Track frequency         │
│  Context-aware rules     │    │  Suggest completions     │
└──────────────────────────┘    └──────────────────────────┘
                                           │
                                           ▼
                                ┌──────────────────────────┐
                                │   Ghost Text             │
                                │                          │
                                │  Faded word completion   │
                                │  Tab to accept           │
                                │  Dictionary-powered      │
                                └──────────────────────────┘
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
- **Throttled persistence** — Saves are debounced/throttled to keep typing smooth

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

## Acknowledgements

- **[Avro Phonetic](https://www.omicronlab.com/avro-keyboard.html)** by [OmicronLab](https://www.omicronlab.com/) — the phonetic Bangla typing approach that inspired this project's transliteration engine. কাগজ builds on the same idea (type English keys, get Bangla) but uses its own context-aware rules and produces native characters per-keystroke rather than converting after confirmation.
- The 50,000+ word Bangla dictionary was generated from verb conjugation paradigms, noun case forms, and curated vocabulary — not sourced from an external corpus.

## License

MIT &copy; [Tareq](https://github.com/tarex)

---

<p align="center">
  <sub>Built with ❤️ for the Bangla-speaking community</sub>
</p>
