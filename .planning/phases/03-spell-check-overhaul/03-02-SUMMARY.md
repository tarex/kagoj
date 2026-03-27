---
phase: 03-spell-check-overhaul
plan: "02"
subsystem: spell-check-ux
tags: [spell-check, keyboard-ux, performance, requestIdleCallback]
dependency_graph:
  requires: ["03-01"]
  provides: ["keyboard-fix-ignore-flow", "background-spell-check"]
  affects: ["src/components/note/spelling-overlay.tsx", "src/hooks/useSpellCheck.ts", "src/components/note/index.tsx"]
tech_stack:
  added: []
  patterns: ["requestIdleCallback with setTimeout fallback", "document-level keydown capture listener", "data attribute for DOM query after scroll"]
key_files:
  created: []
  modified:
    - src/components/note/spelling-overlay.tsx
    - src/hooks/useSpellCheck.ts
    - src/components/note/index.tsx
decisions:
  - "requestIdleCallback for spell-check: wrap localCheckSpelling in idle callback with 3s timeout — guarantees spell-check never blocks typing"
  - "document-level keydown with capture: use addEventListener capture=true so Enter/Escape intercept before textarea handles them"
  - "data-error-index attribute: enables O(1) span lookup on scroll without scanning all children"
  - "scheduleIdle module-level: typeof window guard at module level avoids SSR crashes and works with Next.js"
metrics:
  duration: "3 minutes"
  completed_date: "2026-03-27"
  tasks_completed: 2
  files_modified: 3
---

# Phase 03 Plan 02: Keyboard UX and Background Spell-Check Summary

Keyboard-driven inline fix/ignore flow with Enter/Escape, popup scroll-tracking via data attributes, and spell-check moved to requestIdleCallback background execution so typing is never blocked.

## Tasks Completed

### Task 1: Add keyboard support and scroll-tracking to spelling overlay (f185212)

**Files modified:** `src/components/note/spelling-overlay.tsx`

- Added document-level `keydown` listener (capture phase) when a popup is active
- `Enter` key calls `handleCorrect(activeError)` — accepts correction inline
- `Escape` key calls `handleIgnore(activeError)` — dismisses popup
- Added `data-error-index={startIndex}` on every error span for DOM lookup
- On textarea scroll, queries `[data-error-index="${activeError.startIndex}"]` and recalculates `popupPosition` from its `getBoundingClientRect()`
- Removed `animation: 'popUp 0.2s ...'` — popup now appears instantly
- Made `onIgnore` prop required (was optional) — it is always provided from NoteComponent
- Added keyboard hint (`Enter — ঠিক করুন · Esc — এড়িয়ে যান`) in popup footer

### Task 2: Move spell-check to background execution (8c9271a)

**Files modified:** `src/hooks/useSpellCheck.ts`, `src/components/note/index.tsx`

- Added module-level `scheduleIdle`/`cancelIdle` helpers with `typeof window !== 'undefined'` guard for SSR safety
- `checkSpelling` now schedules `localCheckSpelling` inside `requestIdleCallback` with `{ timeout: 3000 }` max wait
- `idleCallbackRef` stores the callback ID; previous idle callback cancelled before scheduling new one
- `clearSpellCheck` also cancels any pending idle callback
- Removed all 15+ `console.log` calls from `useSpellCheck.ts` (only `console.error` retained)
- NoteComponent: removed `showSpellingErrors &&` gate — `scheduleSpellCheck` now called on every Bangla text change
- Removed `showSpellingErrors` from `handleChange` dependency array

### Task 3: Checkpoint — human verification (skipped per autonomous execution directive)

Automated verification of code requirements:
- `requestIdleCallback` present in `useSpellCheck.ts`
- `cancelIdleCallback` present in `useSpellCheck.ts`
- `Enter`/`Escape` handlers present in `spelling-overlay.tsx`
- `data-error-index` present in `spelling-overlay.tsx`
- `showSpellingErrors &&` gate removed from `index.tsx`

Runtime verification (pnpm dev manual test) deferred to user per checkpoint task design.

## Deviations from Plan

None — plan executed exactly as written. All four acceptance criteria sets satisfied.

## Known Stubs

None.

## Self-Check

- [x] `src/components/note/spelling-overlay.tsx` modified — confirmed
- [x] `src/hooks/useSpellCheck.ts` modified — confirmed
- [x] `src/components/note/index.tsx` modified — confirmed
- [x] Commit f185212 exists — confirmed
- [x] Commit 8c9271a exists — confirmed

## Self-Check: PASSED
