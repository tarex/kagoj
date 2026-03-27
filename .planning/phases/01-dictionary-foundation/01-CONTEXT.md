# Phase 1: Dictionary Foundation - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a comprehensive 50k+ word Bangla dictionary with trie-indexed lookup, replacing the current flat arrays (~5,300 words). Refactor AdaptiveDictionary to use trie internally. Ensure keystroke processing stays under 5ms.

</domain>

<decisions>
## Implementation Decisions

### Dictionary Source & Size
- Compile from multiple open-source BN word lists at build time, ship as static JSON (~50k+ words)
- Single flat file with category comments for organization — simple import
- Include common conjugations (top 5 per verb) — matches how users actually type
- Target ~2MB JSON with trie built at app init — fits comfortably in browser memory

### Trie Data Structure
- Build trie at runtime during app init from word array — simpler build pipeline, ~50ms init
- Custom lightweight trie class in `src/lib/` — no external dependency, ~100 lines
- Store frequency data in trie nodes for sorting suggestions in a single lookup

### Integration with Existing Code
- Refactor AdaptiveDictionary to use trie internally — single API surface, backward compatible
- Remove old `bangla-dictionary.ts` and `bangla-words-extended.ts`, replace with new comprehensive file
- Migration path: load old learned words from localStorage into new trie on first init, then save in new format

### Claude's Discretion
- Exact word list compilation sources and deduplication strategy
- Trie node structure and memory optimization details
- Init timing optimization (lazy vs eager trie build)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/adaptive-dictionary.ts` (289 lines) — AdaptiveDictionary singleton with localStorage persistence, frequency tracking, getSuggestions API
- `src/lib/bangla-dictionary.ts` (110 lines) — ~300 base words as flat array
- `src/lib/bangla-words-extended.ts` (232 lines) — ~5,000 words as flat array
- `src/lib/local-spell-checker.ts` (348 lines) — uses dictionary for spell-check validation

### Established Patterns
- Singleton pattern for AdaptiveDictionary
- localStorage persistence with debounced saves
- Client-side initialization via `initializeOnClient()` to avoid SSR issues
- Combined dictionary built in constructor: `[...new Set([...baseDictionary, ...extendedBanglaWords])]`

### Integration Points
- `AdaptiveDictionary.getSuggestions(partial, limit)` — called by ghost text in NoteComponent
- `AdaptiveDictionary.learnWord(word)` — called on word boundaries during typing
- `local-spell-checker.ts` imports dictionaries directly for validation
- `NoteComponent` imports `adaptiveDictionary` singleton directly

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for dictionary compilation and trie implementation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
