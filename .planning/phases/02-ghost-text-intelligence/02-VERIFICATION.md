---
phase: 02-ghost-text-intelligence
verified: 2026-03-27T16:00:00Z
status: gaps_found
score: 9/10 must-haves verified
gaps:
  - truth: "Ghost text shows AI phrase completions after typing a space and pausing 500ms"
    status: partial
    reason: "requestAISuggestion is called immediately on space character — no 500ms delay applied. AI_TRIGGER_DELAY_MS = 500 is exported from the hook but never imported or used in index.tsx. The 2s rate limit is orthogonal to the 500ms trigger delay."
    artifacts:
      - path: "src/components/note/index.tsx"
        issue: "Line 446 calls requestAISuggestion(cursorContext) directly in handleChange without a setTimeout or debounced wrapper of 500ms. AI_TRIGGER_DELAY_MS from useAISuggestion.ts is never imported."
    missing:
      - "Wrap requestAISuggestion call in a setTimeout of AI_TRIGGER_DELAY_MS (500ms), or use useDebounce with 500ms delay before the AI trigger fires"
      - "Import AI_TRIGGER_DELAY_MS from useAISuggestion and use it as the delay constant"
human_verification:
  - test: "Type Bangla words followed by a space, pause ~500ms"
    expected: "AI ghost text phrase completion appears after the pause; does not appear if user continues typing immediately after space"
    why_human: "The 500ms trigger timing requires observing live behavior — cannot verify timing semantics from static code"
  - test: "Verify AI vs dictionary ghost text color distinction"
    expected: "AI suggestion in terracotta/accent-primary, dictionary suggestion in warm gray/text-tertiary; both readable in dark mode"
    why_human: "Visual distinction and color contrast require visual inspection"
  - test: "Tab accepts AI phrase completion at cursor"
    expected: "Full AI phrase inserted at cursor position; cursor advances to end of inserted text"
    why_human: "Cursor position behavior after insertion requires interactive testing"
  - test: "Toggle to English mode, type words"
    expected: "No ghost text suggestions appear in English mode"
    why_human: "Mode switching and its effect on ghost text requires live interaction"
---

# Phase 2: Ghost Text Intelligence — Verification Report

**Phase Goal:** Writers see AI-powered phrase and sentence completions as ghost text — not just single words — with a clearly visible UI and Tab hint
**Verified:** 2026-03-27T16:00:00Z
**Status:** gaps_found (1 gap) + human verification required
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                 | Status      | Evidence                                                                                  |
|----|---------------------------------------------------------------------------------------|-------------|-------------------------------------------------------------------------------------------|
| 1  | AI suggestion API returns Bangla phrase completions under 40 chars from gpt-4o-mini   | VERIFIED  | `route.ts:19` — `openai.chat('gpt-4o-mini')`, prompt specifies "under 40 characters"    |
| 2  | Dictionary suggestions use 50ms debounce instead of 150ms                             | VERIFIED  | `index.tsx:220` — `useDebounce(updateGhostSuggestionInternal, 50, ...)`                  |
| 3  | AI suggestions are cached in LRU cache keyed by last 100 chars of context             | VERIFIED  | `useAISuggestion.ts:10,53-56` — `LRUCache(50)`, cacheKey = last 100 chars                |
| 4  | AI calls are rate-limited to max 1 request per 2 seconds                              | VERIFIED  | `useAISuggestion.ts:5,67` — `AI_RATE_LIMIT_MS = 2000`, checked before fetch             |
| 5  | Ghost text shows AI phrase completions after typing a space and pausing 500ms         | PARTIAL   | Space fires `requestAISuggestion` immediately — no 500ms delay in `index.tsx:446`        |
| 6  | Ghost text shows dictionary word completions within 50ms debounce                     | VERIFIED  | `index.tsx:220` — 50ms debounced `updateGhostSuggestion` called in `handleInput/handleChange` |
| 7  | A Tab kbd badge appears at the end of ghost suggestions                               | VERIFIED  | `ghost-text.tsx:48-50` — `<span className="ghost-text-tab-hint"><kbd>Tab</kbd></span>` |
| 8  | AI suggestions have a visually distinct color from dictionary suggestions              | VERIFIED  | `globals.css:620-624` — `.ghost-text-suggestion[data-ai="true"]` uses `var(--accent-primary)` |
| 9  | Tab key accepts the full ghost suggestion (both AI and dictionary)                    | VERIFIED  | `index.tsx:293-296` — Tab triggers `acceptGhostSuggestion()`; AI path `248-261` inserts full text |
| 10 | Ghost text falls back to dictionary-only when no AI suggestion available              | VERIFIED  | Dictionary path in `updateGhostSuggestionInternal` operates independently of `aiSuggestion` |

**Score:** 9/10 truths verified (1 partial)

---

### Required Artifacts

| Artifact                              | Expected                                          | Status      | Details                                                                 |
|---------------------------------------|---------------------------------------------------|-------------|-------------------------------------------------------------------------|
| `src/app/api/suggestions/route.ts`    | Ghost text AI completion endpoint (mode=ghost)    | VERIFIED  | Lines 9-31: full `mode === 'ghost'` branch, gpt-4o-mini, returns `{suggestion, source:'ai'}` |
| `src/lib/lru-cache.ts`                | Generic LRU cache with max 50 entries             | VERIFIED  | Full `LRUCache<K,V>` class with get/set/has/clear; Map-based eviction |
| `src/hooks/useAISuggestion.ts`        | React hook with rate limiting and caching          | VERIFIED  | Exports `useAISuggestion`, uses LRUCache(50), rate-limits at 2s, AbortController cleanup |
| `src/components/note/ghost-text.tsx`  | Ghost text overlay with Tab hint badge             | VERIFIED  | `data-ai` prop on suggestion span, `ghost-text-tab-hint` `<kbd>Tab</kbd>` rendered |
| `src/components/note/index.tsx`       | AI suggestion integration in main editor           | VERIFIED  | Imports `useAISuggestion`, calls `requestAISuggestion` on space, wires `isAISuggestion` prop |
| `src/app/globals.css`                 | Ghost text AI styling and Tab badge CSS            | VERIFIED  | `.ghost-text-suggestion[data-ai="true"]`, `.ghost-text-tab-hint`, `.ghost-text-tab-hint kbd` all present |

---

### Key Link Verification

| From                              | To                            | Via                        | Status      | Details                                                                      |
|-----------------------------------|-------------------------------|----------------------------|-------------|------------------------------------------------------------------------------|
| `src/hooks/useAISuggestion.ts`    | `/api/suggestions`            | fetch POST with mode=ghost | VERIFIED  | `useAISuggestion.ts:79-83` — `fetch('/api/suggestions', {body: ...mode:'ghost'...})` |
| `src/hooks/useAISuggestion.ts`    | `src/lib/lru-cache.ts`        | import LRUCache            | VERIFIED  | `useAISuggestion.ts:2` — `import { LRUCache } from '@/lib/lru-cache'`       |
| `src/components/note/index.tsx`   | `src/hooks/useAISuggestion.ts`| import useAISuggestion     | VERIFIED  | `index.tsx:12` — `import { useAISuggestion } from '@/hooks/useAISuggestion'` |
| `src/components/note/index.tsx`   | `src/components/note/ghost-text.tsx` | GhostText with isAISuggestion prop | VERIFIED | `index.tsx:599` — `isAISuggestion={isAISuggestionActive}` |
| `src/components/note/ghost-text.tsx` | `src/app/globals.css`      | CSS class ghost-text-tab-hint | VERIFIED | `ghost-text.tsx:48` — `className="ghost-text-tab-hint"` used in JSX |

---

### Requirements Coverage

| Requirement | Plans      | Description                                                              | Status      | Evidence                                                                  |
|-------------|------------|--------------------------------------------------------------------------|-------------|---------------------------------------------------------------------------|
| GHOST-01    | 02-01, 02-02 | User sees AI-powered phrase/sentence suggestions beyond single-word completion | VERIFIED | gpt-4o-mini phrases via API, wired into GhostText via useAISuggestion  |
| GHOST-02    | 02-02      | Ghost text is clearly visible with a Tab hint indicator                  | VERIFIED  | Tab kbd badge rendered in ghost-text.tsx; CSS styling applied             |
| GHOST-03    | 02-01, 02-02 | Dictionary suggestions appear within 100ms, AI suggestions load async   | VERIFIED  | 50ms debounce for dictionary (well within 100ms); AI fetched async with no blocking |
| PERF-02     | 02-01, 02-02 | Ghost text suggestions appear within 100ms for dictionary lookups        | VERIFIED  | 50ms debounce on `updateGhostSuggestion` satisfies the 100ms requirement  |

All 4 requirement IDs declared across both plans are covered. No orphaned requirements for Phase 2 were found in REQUIREMENTS.md.

---

### Anti-Patterns Found

| File                                     | Line | Pattern                         | Severity    | Impact                                                           |
|------------------------------------------|------|---------------------------------|-------------|------------------------------------------------------------------|
| `src/components/note/index.tsx`          | 446  | Missing 500ms AI trigger delay  | Warning   | AI fires on every space immediately rather than after 500ms pause; `AI_TRIGGER_DELAY_MS` exported from hook but never used |
| `src/app/api/suggestions/route.ts`       | 64   | `error: any` type               | Info      | `error: any` in the spellcheck branch (not ghost-text code path) — pre-existing, not introduced by Phase 2 |

No stubs found. All ghost text paths flow to real data sources (OpenAI API and adaptiveDictionary).

---

### Human Verification Required

#### 1. AI trigger timing

**Test:** In Bangla mode, type a few words followed by a space, then immediately type the next character without pausing.
**Expected:** AI suggestion should NOT appear if user types immediately after the space (no pause). Should only appear if user pauses ~500ms.
**Why human:** Timing behavior requires live interaction; static code shows no 500ms delay is applied before the API call.

#### 2. AI vs dictionary visual distinction

**Test:** Trigger a dictionary completion (partial Bangla word) and then trigger an AI completion (space + pause). Compare colors.
**Expected:** Dictionary suggestion in warm gray (text-tertiary); AI suggestion in terracotta/accent-primary. Both readable in light and dark modes.
**Why human:** Color contrast and visual clarity require visual inspection.

#### 3. Tab acceptance at cursor

**Test:** Position cursor mid-document. Type a Bangla word to get a dictionary ghost completion. Press Tab.
**Expected:** Completion inserted at cursor; cursor advances to end of inserted text.
**Why human:** Cursor position arithmetic after insertion needs interactive verification.

#### 4. English mode suppression

**Test:** Toggle to English mode (Ctrl+Shift+B). Type several words with spaces.
**Expected:** No ghost text suggestions appear.
**Why human:** Mode-toggle side effects require live interaction.

---

### Gaps Summary

One gap was found:

**AI trigger delay missing (Truth #5 — partial):** The PLAN required AI suggestions to fire after "typing a space and pausing 500ms". The hook exports `AI_TRIGGER_DELAY_MS = 500` for callers to use as this delay, but `index.tsx` calls `requestAISuggestion(cursorContext)` immediately on space detection without any timeout wrapper. As a result, the AI request fires the moment the user types a space — not after a pause. While the 2s rate limit prevents API spam, it does not provide the typing-pause UX: the AI suggestion request races with continued typing, and users who type quickly after a space may get unexpected ghost text from the previous context.

**Fix:** In `handleChange` inside `index.tsx`, wrap the `requestAISuggestion(cursorContext)` call in a `setTimeout(..., AI_TRIGGER_DELAY_MS)` with proper cleanup (store the timeout ref and cancel on the next keystroke).

---

_Verified: 2026-03-27T16:00:00Z_
_Verifier: Claude (gsd-verifier)_
