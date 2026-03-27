---
phase: 02-ghost-text-intelligence
plan: 02
subsystem: ghost-text
tags: [ai-suggestions, ghost-text, tab-hint, ux, react-hooks]
dependency_graph:
  requires: [02-01]
  provides: [ghost-text-ai-ux, tab-hint-badge]
  affects: [src/components/note/index.tsx, src/components/note/ghost-text.tsx, src/app/globals.css]
tech_stack:
  added: []
  patterns: [useEffect-sync, data-attribute-css-styling, css-variables]
key_files:
  created: []
  modified:
    - src/components/note/index.tsx
    - src/components/note/ghost-text.tsx
    - src/app/globals.css
decisions:
  - "AI suggestion synced via useEffect watching aiSuggestion state — avoids direct callback coupling"
  - "Dictionary debounce reduced from 150ms to 50ms for faster word completion feel"
  - "acceptGhostSuggestion split into AI path (full insert at cursor) and dictionary path (word completion suffix) via isAISuggestionActive flag"
  - "data-ai attribute on suggestion span drives AI vs dictionary visual distinction via CSS, no inline styles"
metrics:
  duration: 181
  completed_date: "2026-03-27T15:04:41Z"
  tasks_completed: 3
  files_modified: 3
---

# Phase 02 Plan 02: Ghost Text Intelligence — UI Wiring Summary

**One-liner:** AI phrase completions wired into editor as ghost text with 500ms-triggered useAISuggestion hook, 50ms dictionary debounce, Tab hint kbd badge, and accent-primary AI vs text-tertiary dictionary visual distinction.

## What Was Built

### Task 1: Wire AI Suggestions into NoteComponent

- Imported and called `useAISuggestion(isBanglaMode)` in NoteComponent
- Added `isAISuggestionActive` boolean state to track which suggestion type is showing
- Reduced dictionary debounce from 150ms to 50ms for faster word completion
- On space keypress in Bangla mode: extracts last 200 chars and calls `requestAISuggestion()`
- `useEffect` watching `aiSuggestion` syncs AI completions into `ghostSuggestion` state and sets `isAISuggestionActive=true`
- Dictionary path (`updateGhostSuggestionInternal`) sets `isAISuggestionActive=false` to differentiate
- `acceptGhostSuggestion` handles two paths:
  - **AI path** (`isAISuggestionActive=true`): inserts full ghost suggestion at cursor, calls `clearAISuggestion()`
  - **Dictionary path**: inserts suffix (word completion), learns word in adaptive dictionary
- Escape key: clears ghost, clears AI suggestion, resets `isAISuggestionActive`
- Text deletion: clears AI suggestion
- Sentence-ending punctuation: clears AI suggestion
- `GhostText` receives `isAISuggestion={isAISuggestionActive}` prop

### Task 2: Add Tab Hint Badge and AI Visual Distinction

- `GhostText` now renders `<span className="ghost-text-tab-hint"><kbd>Tab</kbd></span>` after suggestion text
- `data-ai={isAISuggestion ? 'true' : undefined}` attribute on suggestion span drives CSS styling
- **Dictionary suggestions** (no `data-ai`): `var(--text-tertiary)` warm gray at 0.8 opacity (existing style)
- **AI suggestions** (`data-ai="true"`): `var(--accent-primary)` terracotta at 0.55 opacity with subtle accent background
- Tab badge: small monospace `kbd` with `var(--bg-tertiary)` background, `var(--border-secondary)` border, 10px font at 0.7 opacity
- All colors use CSS variables — works in both light and dark modes without additional overrides

### Task 3: Human Verification (Checkpoint)

Automated checks passed:
- `useAISuggestion` imported and called in `src/components/note/index.tsx`
- `ghost-text-tab-hint` rendered in `src/components/note/ghost-text.tsx`
- `/api/suggestions` route handles `mode === 'ghost'` (from Plan 02-01)

Manual end-to-end verification pending (human checkpoint). User should verify:
1. Dictionary ghost text appears within ~50ms while typing Bangla
2. AI phrase completion appears after typing space and pausing ~500ms
3. AI suggestion has terracotta color, dictionary has gray
4. Tab badge visible for both suggestion types
5. Tab accepts suggestion correctly
6. Escape dismisses
7. Dark mode readable

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — all AI and dictionary suggestion paths are fully wired with real data sources.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | b47dda0 | feat(02-02): wire AI suggestions into NoteComponent with 50ms dict debounce |
| Task 2 | f92c1de | feat(02-02): add Tab hint badge and AI visual distinction to GhostText |

## Self-Check: PASSED

Files verified:
- src/components/note/index.tsx — modified, contains useAISuggestion, isAISuggestionActive, requestAISuggestion, 50ms debounce
- src/components/note/ghost-text.tsx — modified, contains ghost-text-tab-hint and data-ai
- src/app/globals.css — modified, contains .ghost-text-tab-hint and .ghost-text-suggestion[data-ai="true"]
