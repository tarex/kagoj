---
phase: 03-spell-check-overhaul
plan: "01"
subsystem: spell-check
tags: [bangla, levenshtein, phonetic, suffix, spell-checker, react-hook]

requires:
  - phase: 01-dictionary-foundation
    provides: adaptiveDictionary.isKnownWord and getSuggestions via BanglaTrie
provides:
  - Phonetic similarity scoring (phoneticDistance) exported from local-spell-checker.ts
  - Suffix-aware validation eliminating false positives on common Bangla suffixed words
  - Auto-invalidation of spell errors on text edit in useSpellCheck hook
affects: [04-ui-polish, any future spell-check work]

tech-stack:
  added: []
  patterns:
    - Phonetic distance: Modified Levenshtein with 0.5 sub-cost for same phonetic group chars
    - Suffix-aware spell validation: strip suffix, check stem via isKnownWord before flagging
    - Error invalidation: compare prevText/newText edit region, remove overlapping errors and adjust trailing error positions

key-files:
  created: []
  modified:
    - src/lib/local-spell-checker.ts
    - src/hooks/useSpellCheck.ts

key-decisions:
  - "phoneticDistance uses 0.5 substitution cost for chars in same aspirated/unaspirated pair (12 groups) — reduces false suggestions for phonetically similar words"
  - "Suffix list ordered longest-first to prevent partial matches (e.g. গুলো before র)"
  - "invalidateErrors is a module-level pure function not tied to hook state — easier to test and reason about"
  - "prevTextRef tracks previous text so scheduleSpellCheck can compute edit deltas on every call"

patterns-established:
  - "Phonetic groups: define as Map<char, groupId>, same groupId = 0.5 sub cost in distance function"
  - "Suffix stripping: try longest suffix first, check stem >= 2 chars, short-circuit on first match"

requirements-completed: [SPELL-01, SPELL-02, SPELL-04]

duration: 2min
completed: "2026-03-27"
---

# Phase 03 Plan 01: Spell Check Engine Improvements Summary

**Phonetic-similarity Levenshtein with suffix-aware validation and immediate error invalidation on text edit**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-27T15:20:17Z
- **Completed:** 2026-03-27T15:22:24Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added `BANGLA_PHONETIC_GROUPS` map with 12 aspirated/unaspirated consonant-pair groups (ক/খ, গ/ঘ, চ/ছ, জ/ঝ, ট/ঠ, ড/ঢ, ত/থ, দ/ধ, প/ফ, ব/ভ, শ/ষ/স, ন/ণ)
- Exported `phoneticDistance()` function using 0.5 substitution cost for same-group chars, 1.0 otherwise
- Added suffix-aware validation in `checkSpelling()` — strips 12 common Bangla suffixes (-গুলো, -গুলি, -দের, -তে, -কে, -রা, -ের, -র, -ে, -য়, -তি, -নি) before flagging
- `findClosestWord()` now ranks candidates by `phoneticDistance` instead of plain Levenshtein
- Added `invalidateErrors()` pure function that computes edit region from prevText/newText, removes overlapping errors, and adjusts trailing error positions by length delta
- Added `prevTextRef` to `useSpellCheck` to track previous text for delta computation
- `scheduleSpellCheck` immediately calls `invalidateErrors` before scheduling the debounced full re-check

## Task Commits

1. **Task 1: Add phonetic similarity and suffix-aware validation** - `d5bad3b` (feat)
2. **Task 2: Add error auto-invalidation on text edit** - `11ef62d` (feat)

**Plan metadata:** _(final docs commit follows)_

## Files Created/Modified

- `src/lib/local-spell-checker.ts` - Added BANGLA_PHONETIC_GROUPS, phoneticDistance export, BANGLA_SUFFIXES, suffix-aware checkSpelling, updated findClosestWord
- `src/hooks/useSpellCheck.ts` - Added invalidateErrors helper, prevTextRef, immediate invalidation in scheduleSpellCheck

## Decisions Made

- `phoneticDistance` uses 0.5 sub-cost for same aspirated/unaspirated pair — reduces false correction suggestions (e.g. শ/ষ/স interchange is common in Bangla writing)
- Suffix list ordered longest-first to prevent partial matches (e.g. গুলো must come before র to avoid checking গুলোর as গুলো+র)
- `invalidateErrors` is a module-level pure function (not inside the hook) for clarity and potential testability
- `prevTextRef` initialized to empty string `''`; first call will compute delta from empty to current text (safe — all errors would be "after" edit start 0 and removed, which is correct for fresh state)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Spell checker now provides phonetic-ranked suggestions and avoids common suffix false positives
- Error auto-invalidation gives immediate visual feedback when user edits flagged words
- Ready for Phase 03 Plan 02 (spell-check UX / interaction flow improvements)

## Self-Check: PASSED

- src/lib/local-spell-checker.ts: FOUND
- src/hooks/useSpellCheck.ts: FOUND
- .planning/phases/03-spell-check-overhaul/03-01-SUMMARY.md: FOUND
- commit d5bad3b: FOUND
- commit 11ef62d: FOUND

---
*Phase: 03-spell-check-overhaul*
*Completed: 2026-03-27*
