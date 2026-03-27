# Roadmap: কাগজ — Bangla AI Notebook

## Milestones

- 🚧 **v1.1 Writing Intelligence** - Phases 1-3 (in progress)

## Overview

Three phases transform the writing engine: first build the vocabulary foundation (50k+ word dictionary with trie lookup), then layer AI-powered ghost text suggestions on top of it, then overhaul spell-checking to use that same expanded dictionary for accuracy and smooth inline UX.

## Phases

### 🚧 v1.1 Writing Intelligence (In Progress)

**Milestone Goal:** Make ghost text suggestions smarter and more visible, dramatically improve spell-checking accuracy and UX, and build a comprehensive Bangla dictionary that eliminates false positives.

- [x] **Phase 1: Dictionary Foundation** - Build and integrate the comprehensive Bangla dictionary with fast trie-indexed lookup (completed 2026-03-27)
- [ ] **Phase 2: Ghost Text Intelligence** - Upgrade ghost text to AI-powered phrase/sentence suggestions with clear UX
- [ ] **Phase 3: Spell Check Overhaul** - Rebuild spell-checking for accuracy, phonetic similarity, and inline flow

## Phase Details

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
- [x] 01-01-PLAN.md — Create trie data structure and comprehensive 50k+ word dictionary
- [x] 01-02-PLAN.md — Refactor AdaptiveDictionary to use trie, update spell-checker, remove old files

### Phase 2: Ghost Text Intelligence
**Goal**: Writers see AI-powered phrase and sentence completions as ghost text — not just single words — with a clearly visible UI and Tab hint
**Depends on**: Phase 1
**Requirements**: GHOST-01, GHOST-02, GHOST-03, PERF-02
**Success Criteria** (what must be TRUE):
  1. Ghost text shows phrase or sentence completions sourced from OpenAI, not only dictionary words
  2. A visible Tab hint indicator appears alongside ghost text so users know how to accept it
  3. Dictionary-based suggestions appear within 100ms; AI suggestions load asynchronously without blocking typing
  4. Ghost text is visually distinct and readable against both light and dark backgrounds
**Plans**: 2 plans
Plans:
- [x] 02-01-PLAN.md — AI suggestion API endpoint + LRU cache + useAISuggestion hook
- [ ] 02-02-PLAN.md — Wire AI into editor, Tab hint badge, visual AI/dictionary distinction

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
**Plans**: TBD

## Progress

**Execution Order:** Phases execute in order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Dictionary Foundation | 2/2 | Complete   | 2026-03-27 |
| 2. Ghost Text Intelligence | 0/2 | In progress | - |
| 3. Spell Check Overhaul | 0/TBD | Not started | - |
