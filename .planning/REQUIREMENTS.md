# Requirements: কাগজ

**Defined:** 2026-03-28
**Core Value:** Bangla writing must feel natural and fluid

## v1.2 Requirements

Requirements for the Share as Image milestone. Each maps to roadmap phases.

### Capture

- [x] **CAPT-01**: User can capture full note content as a styled image matching the editor UI
- [x] **CAPT-02**: User can capture selected text as a styled image matching the editor UI
- [x] **CAPT-03**: Captured image renders Bangla text correctly (no tofu/fallback fonts)
- [x] **CAPT-04**: Captured image preserves dark mode styling

### Output

- [x] **OUT-01**: User can download captured image as PNG file
- [ ] **OUT-02**: User can copy captured image to clipboard

### UI

- [x] **UI-01**: Camera/share icon appears in the floating toolbar
- [ ] **UI-02**: User sees loading/success feedback during capture

## v1.1 Requirements (Completed)

### Dictionary

- [x] **DICT-01**: App includes a comprehensive Bangla dictionary (50k+ words) from open-source corpus
- [x] **DICT-02**: Dictionary supports verb conjugations, common nouns, adjectives, and postpositions
- [x] **DICT-03**: Adaptive dictionary merges seamlessly with the expanded base dictionary

### Ghost Text

- [x] **GHOST-01**: User sees AI-powered phrase/sentence suggestions beyond single-word completion
- [x] **GHOST-02**: Ghost text is clearly visible with a Tab hint indicator
- [x] **GHOST-03**: Dictionary suggestions appear within 100ms, AI suggestions load async

### Spell Check

- [x] **SPELL-01**: Spell checker produces fewer false positives using the expanded dictionary
- [x] **SPELL-02**: Correction suggestions account for phonetic similarity (not just edit distance)
- [x] **SPELL-03**: User can fix or ignore errors inline without breaking writing flow
- [x] **SPELL-04**: Spell check errors auto-invalidate when underlying text is edited

### Performance

- [x] **PERF-01**: Phonetic transliteration processes each keystroke in under 5ms
- [x] **PERF-02**: Ghost text suggestions appear within 100ms for dictionary lookups
- [x] **PERF-03**: Spell-check runs in background without blocking typing input
- [x] **PERF-04**: Dictionary lookup uses indexed/trie data structure instead of linear scan

## Future Requirements

### Capture Options

- **COPT-01**: User can toggle between light/dark capture mode
- **COPT-02**: User can adjust padding (tight vs comfortable)

### Sharing

- **SHARE-01**: User can share image via Web Share API on supported devices

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
| Customization screen (theme picker, font selector, sliders) | Fragments design identity; the editor IS the aesthetic |
| Server-side image generation via Puppeteer | Unnecessary latency and infra cost for client-side feature |
| Watermark/branding | Conflicts with clean aesthetic; user explicitly declined |
| Social media direct posting | Out of scope for a writing tool |
| Real-time collaboration | Single-user writing tool, high complexity |
| Mobile native app | Web-first, PWA deferred to future |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAPT-01 | Phase 4 | Complete |
| CAPT-02 | Phase 4 | Complete |
| CAPT-03 | Phase 4 | Complete |
| CAPT-04 | Phase 4 | Complete |
| OUT-01 | Phase 4 | Complete |
| OUT-02 | Phase 5 | Pending |
| UI-01 | Phase 4 | Complete |
| UI-02 | Phase 5 | Pending |

**Coverage:**
- v1.2 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after roadmap creation — all 8 requirements mapped*
