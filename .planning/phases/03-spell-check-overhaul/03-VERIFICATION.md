---
phase: 03-spell-check-overhaul
verified: 2026-03-27T16:00:00Z
status: human_needed
score: 8/8 must-haves verified
re_verification: false
human_verification:
  - test: "Verify suffix-aware validation prevents false positives at runtime"
    expected: "Typing 'বাংলায়', 'ছেলেদের', 'আমাদের' produces no wavy underline"
    why_human: "Depends on the runtime trie dictionary contents — cannot verify without executing the app"
  - test: "Verify Enter/Escape keyboard flow during active typing"
    expected: "Pressing Enter accepts correction; Escape dismisses popup; typing remains fluid"
    why_human: "Document-level keydown capture behavior and interaction with textarea input require browser execution"
  - test: "Verify popup position tracks scroll"
    expected: "After scrolling textarea while popup is open, popup stays visually aligned to the underlined word"
    why_human: "DOM geometry calculation requires visual/browser verification"
  - test: "Verify typing is not blocked during spell-check computation"
    expected: "Typing multiple words in quick succession shows no input lag while spell-check runs in background"
    why_human: "requestIdleCallback scheduling effect is only observable at runtime under real typing conditions"
---

# Phase 03: Spell Check Overhaul — Verification Report

**Phase Goal:** Writers experience accurate spell-checking with far fewer false positives, phonetically-aware suggestions, and an inline fix/ignore flow that never interrupts writing.
**Verified:** 2026-03-27
**Status:** human_needed (all automated checks passed; 4 items require browser execution)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Common Bangla words with suffixes (-র, -ের, -তে, -কে) no longer flagged as errors | VERIFIED (conditional) | `BANGLA_SUFFIXES` array in `local-spell-checker.ts` line 33-35, suffix-stripping loop in `checkSpelling()` lines 317-325; runtime outcome depends on trie contents |
| 2 | Correction suggestions rank phonetically similar words higher than unrelated edits | VERIFIED | `phoneticDistance()` exported at line 225; `findClosestWord()` uses `phoneticDistance` at line 269 (not `levenshteinDistance`) |
| 3 | Editing a flagged word clears its error marker without full re-check | VERIFIED | `invalidateErrors()` pure function lines 20-73 in `useSpellCheck.ts`; called immediately in `scheduleSpellCheck` before debounce at line 140 |
| 4 | User can press Enter to accept correction and Escape to dismiss popup | VERIFIED | `spelling-overlay.tsx` lines 70-88: document-level `keydown` handler with capture=true; `Enter` → `handleCorrect`, `Escape` → `handleIgnore` |
| 5 | Spell-check popup follows the error word position after scroll | VERIFIED | `recalcPopupPosition()` callback at lines 38-50 queries `[data-error-index="${current.startIndex}"]`; called from `syncScroll` handler at line 62 |
| 6 | Spell-check computation never blocks typing input | VERIFIED | `scheduleIdle` wrapper at lines 76-79 uses `requestIdleCallback` with `setTimeout(cb, 1)` SSR fallback; `checkSpelling` wraps `localCheckSpelling` in idle callback at line 113 with `{ timeout: 3000 }` |
| 7 | Spell-check runs on every Bangla text change (not gated by showSpellingErrors) | VERIFIED | `handleChange` in `index.tsx` lines 411-413: `if (isBanglaMode) { scheduleSpellCheck(value, 2000); }` — no `showSpellingErrors` gate |
| 8 | Error positions after edit region are adjusted by length delta | VERIFIED | `invalidateErrors()` lines 60-65: errors after `prevEnd` have `startIndex`/`endIndex` incremented by `lengthDelta` |

**Score:** 8/8 truths verified at code level

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/local-spell-checker.ts` | Phonetic similarity scoring, suffix-aware validation, improved findClosestWord | VERIFIED | `BANGLA_PHONETIC_GROUPS` (12 groups, lines 5-30), `BANGLA_SUFFIXES` (12 suffixes, lines 33-35), `phoneticDistance` exported (line 225), `findClosestWord` uses `phoneticDistance` (line 269) |
| `src/hooks/useSpellCheck.ts` | Auto-invalidation on text edit, requestIdleCallback background execution | VERIFIED | `invalidateErrors` pure function (lines 20-73), `prevTextRef` (line 92), `scheduleIdle`/`cancelIdle` (lines 76-84), `idleCallbackRef` (line 91), `scheduleSpellCheck` invalidates immediately then debounces (lines 137-157) |
| `src/components/note/spelling-overlay.tsx` | Keyboard-accessible popup with Enter/Escape, scroll-synced position | VERIFIED | `keydown` useEffect (lines 70-88), `data-error-index` attribute (line 138), `recalcPopupPosition` via `syncScroll` (lines 38-67), no animation style present |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/local-spell-checker.ts` | `src/lib/adaptive-dictionary.ts` | `adaptiveDictionary.isKnownWord` for stem+suffix checks | WIRED | `adaptiveDictionary.isKnownWord(word)` at line 314, `adaptiveDictionary.isKnownWord(stem)` at line 320 |
| `src/hooks/useSpellCheck.ts` | `src/lib/local-spell-checker.ts` | `checkSpelling` import | WIRED | Line 3: `import { checkSpelling as localCheckSpelling, ... } from '@/lib/local-spell-checker'` |
| `src/components/note/spelling-overlay.tsx` | `src/hooks/useSpellCheck.ts` | `onCorrect`/`onIgnore` callbacks from hook | WIRED | Props `onCorrect` and `onIgnore` are required (not optional) at lines 15-16; called at lines 102, 107 |
| `src/hooks/useSpellCheck.ts` | `src/lib/local-spell-checker.ts` | `checkSpelling` in `requestIdleCallback` | WIRED | `localCheckSpelling(text)` called inside `scheduleIdle` callback at line 119 |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SPELL-01 | 03-01-PLAN.md | Fewer false positives using expanded dictionary | SATISFIED | Suffix-aware validation: 12 suffixes stripped before flagging (lines 317-325 of `local-spell-checker.ts`) |
| SPELL-02 | 03-01-PLAN.md | Corrections account for phonetic similarity | SATISFIED | `phoneticDistance` with 0.5 sub-cost for same phonetic group (lines 225-253); used in `findClosestWord` ranking |
| SPELL-03 | 03-02-PLAN.md | User can fix or ignore errors inline without breaking writing flow | SATISFIED (code) | Enter/Escape keyboard handler, instant popup (no animation), scroll-tracked position in `spelling-overlay.tsx`; runtime UX needs human verification |
| SPELL-04 | 03-01-PLAN.md | Spell check errors auto-invalidate when underlying text is edited | SATISFIED | `invalidateErrors` immediately removes/adjusts errors on text change before debounced re-check |
| PERF-03 | 03-02-PLAN.md | Spell-check runs in background without blocking typing input | SATISFIED (code) | `requestIdleCallback` with `setTimeout` fallback in `useSpellCheck.ts`; all 15+ `console.log` calls removed (0 remaining) |

All 5 requirements from plans verified. REQUIREMENTS.md traceability table marks all 5 as Complete.

**No orphaned requirements:** REQUIREMENTS.md maps SPELL-01, SPELL-02, SPELL-03, SPELL-04, PERF-03 to Phase 3 — all are claimed by plans 03-01 and 03-02.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/note/index.tsx` | 229 | `error: any` in `handleCorrection` | Warning | Bypasses TypeScript type-checking for spell correction; `SpellingError` type should be used |
| `src/components/note/index.tsx` | 373 | `e: any` in `handleInput` | Info | Pre-existing pattern, unrelated to phase 3 work |

Neither anti-pattern is a stub or blocks goal achievement. The `error: any` violates the project's TypeScript strict convention (CLAUDE.md: "TypeScript strict, no `any`") but does not affect correctness.

---

### Human Verification Required

#### 1. Suffix-Aware False Positive Reduction

**Test:** Run `pnpm dev`, open http://localhost:3000, switch to Bangla mode, enable spell check, then type suffixed words: `বাংলায়`, `ছেলেদের`, `আমাদের`, `বইটি`, `মানুষকে`.
**Expected:** None of these words are underlined with a wavy red/danger line.
**Why human:** Correctness depends on the runtime trie containing the stems (`বাংলা`, `ছেলে`, `আমাদ`, etc.). Cannot verify trie contents produce correct `isKnownWord` results without executing the app.

#### 2. Enter/Escape Keyboard Fix/Ignore Flow

**Test:** Type a word that triggers a spell error (e.g., `আমাক`), click the wavy underline to open the popup, then press Enter.
**Expected:** Correction applied inline, popup closes, cursor positioned after corrected word. No page reload or focus loss.
**Why human:** Document-level keydown capture interactions with the textarea cannot be verified statically.

#### 3. Popup Position After Scroll

**Test:** Write enough text to fill the textarea (triggering scroll), ensure a spelling error exists, click it to open popup, then scroll the textarea.
**Expected:** Popup visually follows the error word as the textarea scrolls.
**Why human:** `getBoundingClientRect()` and DOM geometry updates require visual browser verification.

#### 4. No Typing Lag from Background Spell-Check

**Test:** Type a long sentence quickly (10+ words). Observe whether there is any perceptible input lag or character drops.
**Expected:** Typing is immediate and smooth; any spell-check UI updates only appear after typing pauses.
**Why human:** `requestIdleCallback` scheduling effect is a runtime performance property.

---

### Gaps Summary

No gaps found. All automated checks passed:

- All 4 commits documented in SUMMARYs exist in git history (d5bad3b, 11ef62d, f185212, 8c9271a).
- All 3 artifact files exist and contain the required implementations.
- All 4 key links are wired.
- All 5 requirements (SPELL-01, SPELL-02, SPELL-03, SPELL-04, PERF-03) have implementation evidence.
- `handleChange` in `index.tsx` correctly drops the `showSpellingErrors` gate — spell-check is scheduled on every Bangla text change.
- All 15+ `console.log` calls removed from `useSpellCheck.ts` (0 remaining, only `console.error` kept).
- Animation removed from spelling popup (no `animation:` style in `spelling-overlay.tsx`).
- `onIgnore` made required (no longer optional) in `SpellingOverlayProps`.

The only items requiring human judgment are runtime behaviors (false positive reduction in practice, keyboard UX feel, scroll tracking visually, typing responsiveness) which cannot be verified statically.

---

_Verified: 2026-03-27_
_Verifier: Claude (gsd-verifier)_
