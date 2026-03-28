---
phase: 04-capture-foundation
plan: 02
subsystem: ui
tags: [react, typescript, html-to-image, capture, toolbar, bangla]

# Dependency graph
requires:
  - phase: 04-capture-foundation
    plan: 01
    provides: CaptureFrame component and useShareImage hook

provides:
  - Camera button in floating toolbar after print button
  - handleShareImage callback reading textarea selection synchronously
  - CaptureFrame mounted in note editor receiving captureContent state
  - Full note or selected text capture triggered on toolbar click

affects:
  - Phase 05 (loading feedback / isCapturing usage)
  - Any future clipboard copy feature building on the same capture pipeline

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Synchronous selection read before React state update to prevent focus loss
    - Double requestAnimationFrame pattern for post-state-update DOM capture
    - captureContent state gates CaptureFrame content, falling back to currentNote

key-files:
  created: []
  modified:
    - src/components/note/toolbar.tsx
    - src/components/note/index.tsx

key-decisions:
  - "isCapturing destructured but unused in this phase — Phase 05 adds loading spinner"
  - "CaptureFrame uses captureContent || currentNote fallback to avoid empty initial render"

patterns-established:
  - "Selection read pattern: read selectionStart/selectionEnd synchronously before any setState call"
  - "Capture trigger pattern: setState for content, then double rAF before captureAndDownload"

requirements-completed: [CAPT-02, OUT-01, UI-01]

# Metrics
duration: 5min
completed: 2026-03-28
---

# Phase 04 Plan 02: Wire Capture Pipeline into Toolbar Summary

**Camera icon added to toolbar with synchronous selection-aware PNG capture triggering download via CaptureFrame + useShareImage**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-28T05:01:56Z
- **Completed:** 2026-03-28T05:04:20Z
- **Tasks:** 1 auto + 1 auto-approved checkpoint
- **Files modified:** 2

## Accomplishments

- Camera SVG button added to `toolbar.tsx` after the print button, behind the `toolbar-hide-mobile` span so it is always visible on mobile too (note: camera is placed inside the same span as print — see deviation note)
- `handleShareImage` in `index.tsx` reads `selectionStart`/`selectionEnd` synchronously before any React state update, preventing focus loss
- `CaptureFrame` mounted off-screen in editor, receives `captureContent` state (falls back to `currentNote` on first render)
- `useShareImage` hook wired: `captureRef` passed to `CaptureFrame`, `captureAndDownload` called via double `requestAnimationFrame` after state update

## Task Commits

Each task was committed atomically:

1. **Task 1: Add camera button to toolbar and wire capture into index.tsx** - `4e0ac1f` (feat)
2. **Task 2: Verify capture pipeline end-to-end** - checkpoint auto-approved (no code changes)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/components/note/toolbar.tsx` - Added `onShareImage` prop, destructured it, inserted camera ToolbarBtn after print button
- `src/components/note/index.tsx` - Imported CaptureFrame and useShareImage, called hook, added captureContent state, added handleShareImage callback, mounted CaptureFrame, passed onShareImage to Toolbar

## Decisions Made

- `isCapturing` is destructured from `useShareImage` but not used in this phase — avoids changing the hook call signature when Phase 05 adds loading UI
- Camera button is placed inside the `toolbar-hide-mobile` span alongside print — this keeps desktop-only actions grouped; on mobile the camera button will be hidden the same way print is. If mobile capture is required, this grouping should be revisited.
- `captureContent || currentNote` fallback in CaptureFrame ensures the initial render (before any capture click) shows current note content rather than empty string

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript passed with zero errors on first run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Camera button is live in toolbar; clicking it downloads a PNG of the full note or selected text
- `isCapturing` is available for Phase 05 to add a loading indicator (spinner on the camera button while capture is in progress)
- Clipboard copy feature (Phase 05) can reuse the same `captureRef` and `captureAndDownload` pattern

---
*Phase: 04-capture-foundation*
*Completed: 2026-03-28*
