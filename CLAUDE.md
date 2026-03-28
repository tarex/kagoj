# CLAUDE.md

## Project

কাগজ — সহজে বাংলা লিখুন. Next.js app for Bangla writing. Uses phonetic transliteration (type English keys, see native Bangla characters instantly — no romanized text on screen). Not strictly Avro — uses its own context-aware rules. Includes adaptive dictionary learning and spell-checking (currently paused).

## Commands

```bash
pnpm install          # install deps (pnpm only, not npm)
pnpm dev              # dev server with Turbopack
npx tsc --noEmit      # typecheck — run after every change
```

- Do not run `pnpm build` during development.

## Architecture

- **Entry point**: `src/components/note/index.tsx` — orchestrates everything
- **Input**: `src/lib/bangla-input-handler.ts` (singleton) → `src/lib/context-pattern.ts` (100+ transliteration rules)
- **Dictionary**: 3-tier — adaptive (localStorage, 5000 cap) > extended (5000+) > base (300)
- **Spell-check** (paused): local Levenshtein-based (`src/lib/local-spell-checker.ts`), AI fallback via `/api/suggestions` — overlay disabled, needs rethink
- **Persistence**: all localStorage — notes, learned words, frequency, font size, theme

## Tech Stack

- Next.js 16 / React 19 / TypeScript 5.9 strict / Tailwind CSS 4
- Vercel AI SDK v6 (`@ai-sdk/openai` v3) — uses `openai.chat()` for Chat Completions API
- Zod 4, lodash.debounce/throttle

## Rules

- TypeScript strict, no `any`
- `OPENAI_API_KEY` env var required for AI features
- Singletons: BanglaInputHandler, AdaptiveDictionary
- All state persists to localStorage — never break existing keys
