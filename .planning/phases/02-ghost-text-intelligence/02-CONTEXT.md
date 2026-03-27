# Phase 2: Ghost Text Intelligence - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Upgrade ghost text from dictionary-only word completion to AI-powered phrase/sentence suggestions via OpenAI. Add clear Tab hint indicator. Dictionary suggestions under 50ms, AI suggestions async. Visual distinction between AI and dictionary suggestions.

</domain>

<decisions>
## Implementation Decisions

### AI Suggestion Trigger
- Trigger AI suggestions after word boundary (space) when user pauses 500ms
- Send last 2-3 sentences (~200 chars) as context to OpenAI
- Use gpt-4o-mini model — fast, cheap, good enough for completions
- Fallback to dictionary-only word completion when API unavailable (works offline)

### Ghost Text UX
- Show small "Tab" kbd badge at end of ghost suggestion — subtle but clear
- Distinguish AI vs dictionary suggestions with subtle color difference (AI = slightly different shade)
- Max suggestion length ~40 chars (partial sentence) — readable at a glance

### Performance & Caching
- Dictionary suggestion latency target: under 50ms (trie already does 0.05ms, reduce debounce from 150ms to 50ms)
- Simple in-memory LRU cache for AI suggestions (key = last 100 chars, 50 entries) — avoids redundant API calls
- Rate limit AI calls to max 1 request per 2 seconds — prevents cost runaway

### Claude's Discretion
- API route structure for AI suggestions (new endpoint vs modify existing)
- Exact LRU cache implementation details
- Animation/transition details for ghost text appearance

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/note/ghost-text.tsx` — GhostText component with scroll sync, already has `isAISuggestion` prop
- `src/components/note/index.tsx` — `updateGhostSuggestionInternal` function with 150ms debounce
- `src/lib/adaptive-dictionary.ts` — `getSuggestions()` now backed by BanglaTrie (0.05ms lookups)
- `src/app/api/suggestions/route.ts` — existing OpenAI integration for spell-check

### Established Patterns
- useDebounce hook for throttling
- Ghost text overlay with CSS class `.ghost-text-suggestion`
- `@ai-sdk/openai` v3 with `openai.chat()` for Chat Completions API
- `generateText` from `ai` SDK for server-side AI calls

### Integration Points
- Ghost text state: `ghostSuggestion` in NoteComponent
- AI route: `/api/suggestions` (POST) — currently spell-check only, can add mode
- Dictionary: `adaptiveDictionary.getSuggestions(word, limit)` — fast trie-backed
- CSS: `.ghost-text-suggestion` class in globals.css

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
