<h1 align="center">কাগজ</h1>

<p align="center">
  <strong>সহজে বাংলা লিখুন</strong><br/>
  A Bangla writing app with per-keystroke phonetic transliteration. No romanized text on screen, ever.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript" alt="TypeScript 5.9" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
</p>

---

## Why?

Most phonetic Bangla tools show English letters on screen while you type, then convert them after you press space or confirm. **কাগজ** takes a different approach. Every keystroke produces native Bangla characters directly. You never see romanized text. Type how it sounds and Bangla appears instantly.

```
You press:  a  m  i  [space]  b  a  n  g  l  a  y
You see:    আ  ম  ি  [space]  ব  া  ং  ল  া  য়
```

No server required. No account needed. Your writing stays on your device, saved to localStorage, never sent anywhere. You own your text.

---

## Features

**Phonetic Bangla input** - Type on your regular keyboard, see Bangla instantly. 100+ context-aware transliteration rules, complex conjuncts (`ক্ষ`, `জ্ঞ`, `ষ্ট`), toggle between Bangla/English.

**Adaptive dictionary** - Learns from your writing. Three tiers: learned words > extended (5,000+) > base (300). Frequency tracking and a 5,000-word localStorage cap.

**Ghost text suggestions** - Faded word completions as you type. Tab to accept, Escape to dismiss.

**Notes management** - Multiple notes with sidebar, auto-save every 2 seconds, dark/light theme, adjustable font size.

**Spell-checking** *(paused)* - Local Levenshtein matching with optional AI fallback. Disabled while being reworked.

---

## Quick Start

Requires [Node.js](https://nodejs.org/) 18.18+ and [pnpm](https://pnpm.io/).

```bash
git clone https://github.com/tarex/kagoj.git
cd kagoj
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

**Optional**: Copy `.env.example` to `.env.local` and add `OPENAI_API_KEY` for AI features (spell-check is currently paused).

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

| Shortcut | Action |
| --- | --- |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> | Toggle Bangla / English |
| <kbd>Tab</kbd> | Accept ghost suggestion |
| <kbd>Escape</kbd> | Dismiss ghost suggestion |
| <kbd>Ctrl</kbd>+<kbd>B</kbd> | Bold |
| <kbd>Ctrl</kbd>+<kbd>I</kbd> | Italic |
| <kbd>Ctrl</kbd>+<kbd>U</kbd> | Underline |
| <kbd>Ctrl</kbd>+<kbd>D</kbd> | Strikethrough |
| <kbd>Ctrl</kbd>+<kbd>E</kbd> | Code |
| <kbd>Ctrl</kbd>+<kbd>H</kbd> | Highlight |

---

## Architecture

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript 5.9 (strict) |
| AI | Vercel AI SDK v6, OpenAI |
| Validation | Zod 4 |

```
src/
├── app/
│   ├── api/suggestions/    # AI spell-check endpoint
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/note/
│   ├── index.tsx           # Main orchestrator
│   ├── note-editor.tsx     # Textarea
│   ├── ghost-text.tsx      # Word completion overlay
│   ├── spelling-overlay.tsx
│   ├── toolbar.tsx
│   ├── note-list.tsx
│   ├── autocomplete.tsx
│   └── use-notes.ts
│
├── hooks/
│   ├── useSpellCheck.ts
│   └── useDebounce.ts
│
└── lib/
    ├── bangla-input-handler.ts   # Phonetic input processor
    ├── context-pattern.ts        # Transliteration rules
    ├── local-spell-checker.ts
    ├── adaptive-dictionary.ts
    ├── bangla-dictionary.ts      # ~300 words
    └── bangla-words-extended.ts  # ~5,000+ words

tests/                            # Puppeteer E2E tests
```

### Design Decisions

- **Offline-first** - No server needed for core features
- **Singletons** - BanglaInputHandler and AdaptiveDictionary share state across the app
- **Three-tier dictionary** - Adaptive > Extended > Base, ranked by frequency
- **Throttled persistence** - Saves are debounced to keep typing smooth

---

## Data Storage

Everything lives in `localStorage`. Nothing leaves the browser unless you enable AI spell-check.

| Key | Contents |
| --- | --- |
| `notes` | Saved notes |
| `currentNote` | Unsaved draft |
| `noteFontSize` | Font size |
| `noteTheme` | Theme |
| `bangla_learned_words` | Learned words |
| `bangla_word_frequency` | Word frequencies |

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Make changes, run `pnpm lint`
4. Open a PR

Areas that could use help: dictionary expansion, transliteration edge cases, test coverage (Jest/Vitest), mobile responsiveness, voice input.

---

## Acknowledgements

- [Avro Phonetic](https://www.omicronlab.com/avro-keyboard.html) by OmicronLab inspired the phonetic approach. কাগজ uses its own rules and produces native characters per-keystroke instead of converting after confirmation.
- The 50,000+ word dictionary was generated from verb conjugation paradigms, noun case forms, and curated vocabulary.

## License

MIT &copy; [Tareq](https://github.com/tarex)
