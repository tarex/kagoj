# External Integrations

**Analysis Date:** 2025-03-27

## APIs & External Services

**Large Language Model:**
- OpenAI GPT API - AI-powered spell checking and text generation
  - SDK/Client: `@ai-sdk/openai` 3.0.48 via Vercel AI SDK
  - Auth: Environment variable `OPENAI_API_KEY` (required, contains secret key)
  - Implementation: `/src/app/api/suggestions/route.ts`
  - Models used: `gpt-3.5-turbo` for spell checking

## Data Storage

**Databases:**
- None - Application uses client-side storage only

**File Storage:**
- Local filesystem only
- No cloud storage integration

**Caching:**
- Browser localStorage - Persistent client-side storage
  - Notes: `localStorage.setItem('notes', ...)`
  - Current note: `localStorage.setItem('currentNote', ...)`
  - Font size: `localStorage.setItem('noteFontSize', ...)`
  - Theme preference: `localStorage.setItem('noteTheme', ...)`
  - Adaptive dictionary learned words: `localStorage.getItem(LEARNED_WORDS_KEY)`
  - Word frequency data: `localStorage.getItem(WORD_FREQUENCY_KEY)`

**Client-Side State:**
- React hooks manage ephemeral application state
- No server-side session management

## Authentication & Identity

**Auth Provider:**
- None - Application is public, no user authentication
- No login/signup system
- No user accounts

**API Security:**
- OpenAI API key stored in environment variables (`OPENAI_API_KEY`)
- Never exposed to client-side code
- Key-based authentication with OpenAI service

## Monitoring & Observability

**Error Tracking:**
- None detected - No Sentry, Rollbar, or similar integration

**Logs:**
- Console logging only (`console.log`, `console.error`)
- Used for debugging spell check and input processing
- No persistent logging infrastructure

## CI/CD & Deployment

**Hosting:**
- Not specified - Deployment-agnostic Next.js application
- Compatible with Vercel, self-hosted Node servers, or any Node.js hosting
- Supports standalone builds

**CI Pipeline:**
- None detected - No GitHub Actions, GitLab CI, or similar configuration

## Environment Configuration

**Required env vars:**
- `OPENAI_API_KEY` - OpenAI API key for spell checking feature (string, secret)

**Optional env vars:**
- `NEXT_PUBLIC_DISABLE_SPELL_CHECK` - Set to `'true'` to disable spell checking via `/src/hooks/useSpellCheck.ts`

**Secrets location:**
- `.env.local` file (present, git-ignored)
- Contains `OPENAI_API_KEY` and optional `NEXT_PUBLIC_DISABLE_SPELL_CHECK`

## Webhooks & Callbacks

**Incoming:**
- None - No webhook endpoints

**Outgoing:**
- None - No external service callbacks

## API Endpoints

**Internal:**
- `POST /api/suggestions` - Spell checking endpoint
  - Location: `/src/app/api/suggestions/route.ts`
  - Request body: `{ text: string, mode: 'spellcheck' | 'suggestion' }`
  - Response: `{ errors: [{ word, correction, startIndex, endIndex, confidence }] }`
  - Authenticates with OpenAI via API key in `OPENAI_API_KEY`
  - Returns spell-checking results for Bangla text using GPT-3.5-turbo

## Language Support

**Built-in Dictionaries:**
- Bangla/Bengali word lists: `/src/lib/bangla-dictionary.ts`
- Extended word collections: `/src/lib/bangla-words-extended.ts`
- Local spell checker implementation: `/src/lib/local-spell-checker.ts`
- Adaptive dictionary that learns from user input: `/src/lib/adaptive-dictionary.ts`
- Phonetic conversion rules: `/src/lib/context-pattern.ts`

## Integrations Summary

| Component | Type | Status | Purpose |
|-----------|------|--------|---------|
| OpenAI API | External Service | Required | Spell checking via GPT-3.5-turbo |
| Browser localStorage | Client Storage | Built-in | Persist notes, preferences, learned words |
| Bangla Dictionaries | Built-in | Always-on | Phonetic input processing, spell checking |

---

*Integration audit: 2025-03-27*
