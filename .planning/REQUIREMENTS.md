# Requirements: কাগজ — Bangla AI Notebook

**Defined:** 2026-03-27
**Core Value:** Bangla writing must feel natural and fluid

## v1.1 Requirements

Requirements for the Writing Intelligence milestone. Each maps to roadmap phases.

### Dictionary

- [ ] **DICT-01**: App includes a comprehensive Bangla dictionary (50k+ words) from open-source corpus
- [ ] **DICT-02**: Dictionary supports verb conjugations, common nouns, adjectives, and postpositions
- [ ] **DICT-03**: Adaptive dictionary merges seamlessly with the expanded base dictionary

### Ghost Text

- [ ] **GHOST-01**: User sees AI-powered phrase/sentence suggestions beyond single-word completion
- [ ] **GHOST-02**: Ghost text is clearly visible with a Tab hint indicator
- [ ] **GHOST-03**: Dictionary suggestions appear within 100ms, AI suggestions load async

### Spell Check

- [ ] **SPELL-01**: Spell checker produces fewer false positives using the expanded dictionary
- [ ] **SPELL-02**: Correction suggestions account for phonetic similarity (not just edit distance)
- [ ] **SPELL-03**: User can fix or ignore errors inline without breaking writing flow
- [ ] **SPELL-04**: Spell check errors auto-invalidate when underlying text is edited

### Performance

- [ ] **PERF-01**: Phonetic transliteration processes each keystroke in under 5ms
- [ ] **PERF-02**: Ghost text suggestions appear within 100ms for dictionary lookups
- [ ] **PERF-03**: Spell-check runs in background without blocking typing input
- [ ] **PERF-04**: Dictionary lookup uses indexed/trie data structure instead of linear scan

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### AI Features

- **AI-01**: Voice-to-text dictation in Bangla
- **AI-02**: AI-powered grammar checking (beyond spelling)
- **AI-03**: Writing style suggestions and tone analysis

### Platform

- **PLAT-01**: PWA support for offline-first mobile experience
- **PLAT-02**: Cloud sync across devices
- **PLAT-03**: Export to PDF/DOCX

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time collaboration | Single-user writing tool, high complexity |
| Mobile native app | Web-first, PWA deferred to v2 |
| Code editor integration | Separate product concern |
| Grammar checking | Beyond v1.1 scope, spelling first |
| Custom font upload | System fonts + loaded web fonts sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DICT-01 | Phase 1 | Pending |
| DICT-02 | Phase 1 | Pending |
| DICT-03 | Phase 1 | Pending |
| PERF-04 | Phase 1 | Pending |
| PERF-01 | Phase 1 | Pending |
| GHOST-01 | Phase 2 | Pending |
| GHOST-02 | Phase 2 | Pending |
| GHOST-03 | Phase 2 | Pending |
| PERF-02 | Phase 2 | Pending |
| SPELL-01 | Phase 3 | Pending |
| SPELL-02 | Phase 3 | Pending |
| SPELL-03 | Phase 3 | Pending |
| SPELL-04 | Phase 3 | Pending |
| PERF-03 | Phase 3 | Pending |

**Coverage:**
- v1.1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after roadmap creation*
