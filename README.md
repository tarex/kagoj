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

**Phonetic Bangla input** -- Type on your regular keyboard, see Bangla instantly. 100+ context-aware transliteration rules, complex conjuncts (`ক্ষ`, `জ্ঞ`, `ষ্ট`), toggle between Bangla/English.

**Adaptive dictionary** -- Learns from your writing. Three tiers: learned words > extended (50,000+) > base collocations. Frequency tracking with bigram-aware predictions.

**Ghost text suggestions** -- Faded word completions as you type powered by trie lookup + bigram context. Optional AI phrase completion via OpenAI. Tab to accept, Escape to dismiss.

**Typing guide** -- Built-in searchable reference showing all phonetic mappings organized by the traditional barga structure, with staggered entrance animations. Accessible from the toolbar.

**Notes management** -- Multiple notes with sidebar, auto-save every 2 seconds, dark/light theme, adjustable font size. Share notes as images.

**Rich formatting** -- Bold, italic, underline, strikethrough, code, highlight, bullet and numbered lists.

**PWA** -- Installable as a native-feeling app. Works offline with service worker caching.

**Spell-checking** *(paused)* -- Local Levenshtein matching with optional AI fallback. Disabled while being reworked.

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

**Optional**: Copy `.env.example` to `.env.local` and add `OPENAI_API_KEY` for AI ghost text suggestions. The app works fully without it.

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
│  Keystroke -> Bangla     │───>│  Learn word on boundary  │
│  "a" -> "আ", "m" -> "ম" │    │  Track frequency         │
│  Context-aware rules     │    │  Trie + bigram suggest   │
└──────────────────────────┘    └──────────────────────────┘
                                           │
                                           ▼
                                ┌──────────────────────────┐
                                │   Ghost Text             │
                                │                          │
                                │  Dictionary completion   │
                                │  AI phrase suggestion    │
                                │  Tab to accept           │
                                └──────────────────────────┘
```

---

## Typing Guide

The app includes a built-in typing guide (accessible via the keyboard icon in the toolbar). Here's a quick reference:

### Vowels

| Type | Bangla | Type | Bangla |
| --- | --- | --- | --- |
| `o` | অ | `a` | আ |
| `i` | ই | `I` / `ee` | ঈ |
| `u` | উ | `U` | ঊ |
| `rri` | ঋ | `e` | এ |
| `OI` | ঐ | `O` | ও |
| `OU` | ঔ | | |

### Banjonborno (Consonants)

| | 1st | 2nd | 3rd | 4th | 5th |
| --- | --- | --- | --- | --- | --- |
| **ক** | `k` ক | `kh` খ | `g` গ | `gh` ঘ | `Ng` ঙ |
| **চ** | `c` চ | `ch` ছ | `j` জ | `jh` ঝ | `NG` ঞ |
| **ট** | `T` ট | `Th` ঠ | `D` ড | `Dh` ঢ | `N` ণ |
| **ত** | `t` ত | `th` থ | `d` দ | `dh` ধ | `n` ন |
| **প** | `p` প | `ph` ফ | `b` ব | `bh` ভ | `m` ম |

### Other Consonants

| Type | Bangla | Type | Bangla | Type | Bangla |
| --- | --- | --- | --- | --- | --- |
| `z` | য | `r` | র | `l` | ল |
| `S` | শ | `sh` | ষ | `s` | স |
| `h` | হ | `R` | ড় | `Rh` | ঢ় |
| `y` | য় | `x` | ক্স | | |

### Special

| Type | Result | Notes |
| --- | --- | --- |
| `ng` | ং | |
| `` t` `` | ৎ | Khondo t |
| `,,` | ্ | Hasanta (conjunct former) |
| `^` | ঁ | Chandrabindu |
| `:` | ঃ | |
| `.` | । | Dari |
| `\.` | . | Literal dot |
| `` ` `` | | Breaks conjunct |
| `$` | ৳ | Taka sign |
| `0-9` | ০-৯ | Bangla numerals |

**Tip**: Uppercase = retroflex/aspirated (`T` = ট, `t` = ত).

---

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> | Toggle Bangla / English |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>T</kbd> | Toggle theme |
| <kbd>Tab</kbd> | Accept ghost suggestion |
| <kbd>Escape</kbd> | Dismiss ghost suggestion |
| <kbd>Ctrl</kbd>+<kbd>/</kbd> | Typing guide / shortcuts panel |
| <kbd>Ctrl</kbd>+<kbd>N</kbd> | New note |
| <kbd>Ctrl</kbd>+<kbd>S</kbd> | Save |
| <kbd>Ctrl</kbd>+<kbd>Z</kbd> | Undo |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> | Redo |
| <kbd>Ctrl</kbd>+<kbd>B</kbd> | Bold |
| <kbd>Ctrl</kbd>+<kbd>I</kbd> | Italic |
| <kbd>Ctrl</kbd>+<kbd>U</kbd> | Underline |
| <kbd>Ctrl</kbd>+<kbd>D</kbd> | Strikethrough |
| <kbd>Ctrl</kbd>+<kbd>E</kbd> | Code |
| <kbd>Ctrl</kbd>+<kbd>H</kbd> | Highlight |
| <kbd>Ctrl</kbd>+<kbd>P</kbd> | Print |

---

## Architecture

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript 5.9 (strict) |
| AI | Vercel AI SDK v6, OpenAI (optional) |
| Validation | Zod 4 |

```
src/
├── app/
│   ├── api/suggestions/       # AI ghost text endpoint
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── console-greeting.tsx   # Console easter egg
│   └── pwa-register.tsx
│
├── components/note/
│   ├── index.tsx              # Main orchestrator
│   ├── keyboard-shortcuts-panel.tsx  # Typing guide + shortcuts
│   ├── note-editor.tsx        # Textarea
│   ├── ghost-text.tsx         # Word completion overlay
│   ├── toolbar.tsx            # Formatting toolbar
│   ├── note-list.tsx          # Sidebar
│   ├── onboarding.tsx         # First-use experience
│   ├── share-preview-modal.tsx
│   └── word-suggestion-popup.tsx
│
├── hooks/
│   ├── useAISuggestion.ts     # AI ghost text (LRU cache, rate-limited)
│   ├── useSpellCheck.ts
│   ├── useShareImage.ts
│   ├── useUndoRedo.ts
│   └── useDebounce.ts
│
└── lib/
    ├── bangla-input-handler.ts   # Phonetic input processor (singleton)
    ├── context-pattern.ts        # 100+ transliteration rules
    ├── adaptive-dictionary.ts    # Learns from writing (singleton)
    ├── trie.ts                   # Trie for fast prefix lookup
    ├── bigram-store.ts           # Bigram word prediction
    ├── bangla-collocations.ts    # Pre-seeded word pairs
    ├── bangla-words-comprehensive.ts  # 50,000+ words
    ├── local-spell-checker.ts
    └── lru-cache.ts              # LRU cache for AI suggestions

public/
    ├── sw.js                     # Service worker
    └── manifest.json             # PWA manifest
```

### Design Decisions

- **Offline-first** -- No server needed for core features
- **Singletons** -- BanglaInputHandler and AdaptiveDictionary share state across the app
- **Three-tier dictionary** -- Adaptive > Comprehensive > Collocations, ranked by frequency
- **Bigram context** -- Word predictions consider the previous word for smarter suggestions
- **Throttled persistence** -- Saves are debounced to keep typing smooth
- **AI optional** -- App works fully without an API key; AI adds phrase-level ghost text

---

## Data Storage

Everything lives in `localStorage`. Nothing leaves the browser unless you enable AI ghost text.

| Key | Contents |
| --- | --- |
| `notes` | Saved notes |
| `currentNote` | Unsaved draft |
| `selectedNoteIndex` | Active note index |
| `noteFontSize` | Font size |
| `noteTheme` | Theme |
| `bangla_learned_words` | Learned words |
| `bangla_word_frequency` | Word frequencies |
| `bangla_bigrams` | Learned bigrams |

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Make changes, run `npx tsc --noEmit`
4. Open a PR

Areas that could use help: dictionary expansion, transliteration edge cases, test coverage, mobile responsiveness, voice input, spell-check rework.

---

## Acknowledgements

- [Avro Phonetic](https://www.omicronlab.com/avro-keyboard.html) by OmicronLab inspired the phonetic approach. কাগজ uses its own rules and produces native characters per-keystroke instead of converting after confirmation.
- The 50,000+ word dictionary was generated from verb conjugation paradigms, noun case forms, and curated vocabulary.

## License

MIT &copy; [Tareq](https://github.com/tarex)
