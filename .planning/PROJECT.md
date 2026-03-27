# কাগজ — Bangla AI Notebook

## What This Is

A web-based Bangla writing application with Avro-style phonetic typing, inline word suggestions, spell-checking, and an adaptive learning dictionary. Built for anyone who writes in Bangla and wants a distraction-free, intelligent writing experience.

## Core Value

Bangla writing must feel natural and fluid — phonetic input, smart suggestions, and spell-checking should work together seamlessly so the writer never thinks about the tool, only the words.

## Requirements

### Validated

- Avro-style phonetic input with 100+ transliteration rules — v0.1
- Multiple notes with localStorage persistence and auto-save — v0.1
- Ghost text word completion from adaptive dictionary — v0.1
- Local spell-checking with Levenshtein distance — v0.1
- AI spell-check fallback via OpenAI API — v0.1
- Dark/light theme toggle — v0.1
- Text formatting shortcuts (bold, italic, etc.) — v0.1
- Adaptive dictionary that learns from user input — v0.1

### Active

(See REQUIREMENTS.md for v1.1 milestone)

### Out of Scope

- Voice-to-text / dictation — complexity, not core to writing flow
- Mobile native app — web-first approach
- Real-time collaboration — single-user tool
- Code editor integration — separate product

## Current Milestone: v1.1 Writing Intelligence

**Goal:** Make ghost text suggestions smarter and more visible, dramatically improve spell-checking accuracy and UX, and build a comprehensive Bangla dictionary.

**Target features:**
- AI-powered ghost text suggestions (sentence/phrase level)
- Redesigned suggestion UX with clear visibility and Tab hint
- Comprehensive Bangla dictionary (50k+ words from open-source corpora)
- Improved spell-checker with fewer false positives
- Better correction suggestions
- Streamlined spell-check interaction flow

## Context

- Current dictionary has ~5,300 words (300 base + 5000 extended) — too small, causes excessive false positives
- Ghost text only does single-word completion from dictionary — no phrase/sentence awareness
- Spell-checker uses basic Levenshtein distance without phonetic similarity
- OpenAI API used only for spell-check fallback, not for suggestions
- Existing codebase map at `.planning/codebase/`

## Constraints

- **Tech stack**: Next.js 16, React 19, TypeScript strict — maintain existing stack
- **Package manager**: pnpm only
- **AI provider**: OpenAI (existing integration) — can expand models
- **Offline-first**: Core writing/dictionary must work without API calls
- **Performance**: No perceptible lag during typing — suggestions must be async
- **No build after changes**: Development workflow uses `pnpm dev` only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Local-first spell-checking | Works offline, fast | — Pending |
| Adaptive dictionary with frequency tracking | Personalizes over time | — Pending |
| Warm manuscript design system | Bangla-first literary aesthetic | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-27 after project initialization*
