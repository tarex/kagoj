# Phase 3: Spell Check Overhaul - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Rebuild spell-checking for accuracy (fewer false positives via 52k+ dictionary), phonetic similarity scoring, streamlined inline fix/ignore UX, auto-invalidation of errors on text edit, and background execution without blocking typing.

</domain>

<decisions>
## Implementation Decisions

### Fewer False Positives (SPELL-01)
- The 52k+ trie-backed dictionary from Phase 1 already dramatically reduces false positives
- Skip words under 3 characters (already implemented)
- Add common suffixes/postpositions check before flagging (e.g., -র, -ের, -তে, -কে)

### Phonetic Similarity (SPELL-02)
- Add Bangla phonetic similarity scoring alongside Levenshtein distance
- Group similar-sounding consonants: ক/খ, গ/ঘ, চ/ছ, জ/ঝ, ট/ঠ, ড/ঢ, ত/থ, দ/ধ, প/ফ, ব/ভ, শ/ষ/স, ন/ণ
- Weight phonetically-similar substitutions at 0.5 edit distance (vs 1.0 for unrelated)
- Sort correction suggestions by weighted distance (phonetic first, then Levenshtein)

### Inline Fix/Ignore Flow (SPELL-03)
- Keep the wavy underline + popup approach (already exists)
- Make popup appear faster (remove animation delay)
- Add keyboard support: Enter to fix, Escape to dismiss popup
- Popup should follow the error word position even after scroll

### Auto-Invalidation (SPELL-04)
- Clear specific error markers when the underlying text at that position changes
- Track error positions; on text change, recalculate which errors are still valid
- Invalidate errors whose text range was modified (not just any edit)

### Background Execution (PERF-03)
- Move spell-check computation to a web worker if possible, otherwise use requestIdleCallback
- Fallback: keep current debounced approach but ensure it yields to main thread via setTimeout chunks
- Never block the main thread during spell-check

### Claude's Discretion
- Web worker vs requestIdleCallback decision (based on complexity)
- Exact phonetic similarity group weights
- Error recalculation algorithm details

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/local-spell-checker.ts` — checkSpelling(), findClosestWord() using trie prefix search, levenshteinDistance()
- `src/hooks/useSpellCheck.ts` — hook with scheduleSpellCheck(), handleSpellingCorrection(), handleIgnoreSpelling()
- `src/components/note/spelling-overlay.tsx` — wavy underline overlay with Fix/Ignore popup using CSS variables
- `src/lib/adaptive-dictionary.ts` — isKnownWord(), getSuggestions() (trie-backed)

### Established Patterns
- Spell errors as `{ word, correction, startIndex, endIndex, confidence }` objects
- scheduleSpellCheck with 2s debounce
- SpellingOverlay syncs scroll with textarea
- Popup uses fixed positioning relative to error word

### Integration Points
- `useSpellCheck(isBanglaMode)` returns spellingErrors, handlers
- `checkSpelling(text)` in local-spell-checker.ts — main entry point
- SpellingOverlay receives errors array and renders overlay
- NoteComponent onChange triggers scheduleSpellCheck when errors are showing

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
