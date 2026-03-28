# Roadmap: কাগজ -- Bangla AI Notebook

## Milestones

- ✅ **v1.1 Writing Intelligence** - Phases 1-3 (shipped 2026-03-28)
- 🚧 **v1.2 Share as Image** - Phases 4-5 (in progress)

## Overview

Three phases transformed the writing engine in v1.1: vocabulary foundation, AI ghost text, and spell-check overhaul. v1.2 adds image export in two phases: capture correctness first (mirror div, font pre-check, dark mode clone, PNG download), then clipboard integration and UX polish (Safari/Firefox handling, loading/success feedback).

## Phases

<details>
<summary>✅ v1.1 Writing Intelligence (Phases 1-3) - SHIPPED 2026-03-28</summary>

### Phase 1: Dictionary Foundation
**Goal**: Writers have access to a comprehensive 50k+ word Bangla dictionary that loads fast and serves as the shared engine for both ghost text and spell-check
**Depends on**: Nothing (first phase)
**Requirements**: DICT-01, DICT-02, DICT-03, PERF-04, PERF-01
**Success Criteria** (what must be TRUE):
  1. App ships with a dictionary of 50,000+ Bangla words covering verbs, nouns, adjectives, and postpositions
  2. Dictionary lookups complete in under 5ms using trie or indexed structure (no linear scan)
  3. User's learned words from adaptive dictionary appear alongside base dictionary without duplication
  4. Phonetic transliteration processes each keystroke in under 5ms with no perceptible lag
**Plans**: 2 plans
Plans:
- [x] 01-01-PLAN.md -- Create trie data structure and comprehensive 50k+ word dictionary
- [x] 01-02-PLAN.md -- Refactor AdaptiveDictionary to use trie, update spell-checker, remove old files

### Phase 2: Ghost Text Intelligence
**Goal**: Writers see AI-powered phrase and sentence completions as ghost text -- not just single words -- with a clearly visible UI and Tab hint
**Depends on**: Phase 1
**Requirements**: GHOST-01, GHOST-02, GHOST-03, PERF-02
**Success Criteria** (what must be TRUE):
  1. Ghost text shows phrase or sentence completions sourced from OpenAI, not only dictionary words
  2. A visible Tab hint indicator appears alongside ghost text so users know how to accept it
  3. Dictionary-based suggestions appear within 100ms; AI suggestions load asynchronously without blocking typing
  4. Ghost text is visually distinct and readable against both light and dark backgrounds
**Plans**: 2 plans
Plans:
- [x] 02-01-PLAN.md -- AI suggestion API endpoint + LRU cache + useAISuggestion hook
- [x] 02-02-PLAN.md -- Wire AI into editor, Tab hint badge, visual AI/dictionary distinction

### Phase 3: Spell Check Overhaul
**Goal**: Writers experience accurate spell-checking with far fewer false positives, phonetically-aware suggestions, and an inline fix/ignore flow that never interrupts writing
**Depends on**: Phase 1
**Requirements**: SPELL-01, SPELL-02, SPELL-03, SPELL-04, PERF-03
**Success Criteria** (what must be TRUE):
  1. Common Bangla words from the expanded dictionary no longer trigger spell-check errors
  2. Correction suggestions account for phonetic similarity (e.g., similar-sounding words rank higher)
  3. User can accept a correction or dismiss an error inline with a single action without leaving the text
  4. Editing a flagged word clears its error marker automatically without requiring re-check
  5. Spell-check runs in the background and never causes typing input to lag or stutter
**Plans**: 2 plans
Plans:
- [x] 03-01-PLAN.md -- Phonetic similarity scoring, suffix-aware validation, error auto-invalidation
- [x] 03-02-PLAN.md -- Keyboard-driven inline fix/ignore, background spell-check execution

</details>

### 🚧 v1.2 Share as Image (In Progress)

**Milestone Goal:** Let users capture their Bangla text as a shareable PNG image using the actual editor UI aesthetic, with download and clipboard copy.

- [ ] **Phase 4: Capture Foundation** - Build the styled PNG capture pipeline: mirror div, Bangla font pre-check, dark mode preservation, full/selected-text capture, and PNG download
- [ ] **Phase 5: Clipboard and UX Polish** - Add clipboard copy with browser-specific handling (Safari/Firefox), loading states, and success feedback

## Phase Details

### Phase 4: Capture Foundation
**Goal**: Users can capture their Bangla note content as a correctly styled PNG -- matching the editor's dark aesthetic, rendering Bangla script correctly, and downloadable as a file
**Depends on**: Phase 3
**Requirements**: CAPT-01, CAPT-02, CAPT-03, CAPT-04, OUT-01, UI-01
**Success Criteria** (what must be TRUE):
  1. A camera/share icon appears in the floating toolbar and triggers the capture flow
  2. User can capture the full note content as a PNG that visually matches the dark editor background and styling
  3. User can capture only selected text as a PNG with the same styling
  4. Bangla script renders correctly in the captured image (no tofu, boxes, or fallback fonts)
  5. User can download the captured image as a PNG file
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md -- CaptureFrame component + useShareImage hook + html-to-image install
- [x] 04-02-PLAN.md -- Toolbar camera icon + full/selected capture wiring + PNG download

### Phase 5: Clipboard and UX Polish
**Goal**: Users can copy the captured image to their clipboard across Chrome, Safari, and Firefox, and receive clear feedback throughout the capture and copy flow
**Depends on**: Phase 4
**Requirements**: OUT-02, UI-02
**Success Criteria** (what must be TRUE):
  1. User can copy the captured image to clipboard in Chrome and Safari without errors
  2. Firefox users see a graceful fallback (download prompt with explanation) instead of a silent failure
  3. User sees a loading indicator while capture is in progress and a success message after copy or download completes
**Plans**: 1 plan

Plans:
- [ ] 05-01-PLAN.md -- Clipboard copy (Safari Promise pattern, Firefox fallback) + loading/success feedback

## Progress

**Execution Order:** Phases execute in order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Dictionary Foundation | v1.1 | 2/2 | Complete | 2026-03-27 |
| 2. Ghost Text Intelligence | v1.1 | 2/2 | Complete | 2026-03-27 |
| 3. Spell Check Overhaul | v1.1 | 2/2 | Complete | 2026-03-28 |
| 4. Capture Foundation | v1.2 | 2/2 | Complete |  |
| 5. Clipboard and UX Polish | v1.2 | 0/1 | Not started | - |
