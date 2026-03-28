---
phase: 05-clipboard-and-ux-polish
plan: 01
subsystem: ui
tags: [clipboard, html-to-image, react, hooks, safari, firefox]

requires:
  - phase: 04-capture-foundation
    provides: useShareImage hook with captureAndDownload and CaptureFrame component

provides:
  - captureAndCopy method with Safari Promise-based ClipboardItem pattern
  - CopyStatus type and copyStatus state for transient feedback
  - captureToBlob shared helper extracted from captureAndDownload
  - Firefox graceful download fallback when ClipboardItem undefined
  - Clipboard copy button in toolbar next to camera button
  - Disabled + reduced opacity on both capture buttons during isCapturing
  - Inline status labels: Copied! / Saved! / Downloaded (clipboard unavailable)

affects: [05-clipboard-and-ux-polish]

tech-stack:
  added: []
  patterns:
    - "Safari clipboard: pass unresolved Promise directly to ClipboardItem constructor"
    - "Browser detection for clipboard: typeof ClipboardItem !== 'undefined'"
    - "CopyStatus enum: idle -> capturing -> copied/downloaded/fallback -> idle (2s reset)"
    - "captureToBlob extracted as shared useCallback — both download and copy paths use it"
    - "Selection read synchronously before setCaptureContent to avoid focus loss on re-render"

key-files:
  created: []
  modified:
    - src/hooks/useShareImage.ts
    - src/components/note/toolbar.tsx
    - src/components/note/index.tsx

key-decisions:
  - "Pass unresolved Promise to ClipboardItem for Safari compatibility — do not await captureToBlob first"
  - "Detect Firefox via typeof ClipboardItem check, download fallback with 'Downloaded (clipboard unavailable)' label"
  - "Inline toolbar status labels instead of toast system — matches subtle non-disruptive requirement"
  - "Switch from toPng to toBlob in html-to-image — blob required for Clipboard API and avoids FileReader round-trip on download"

patterns-established:
  - "CopyStatus: idle | capturing | copied | downloaded | fallback — reusable pattern for async UI feedback"
  - "captureToBlob as shared private hook utility — avoids code duplication between download and copy paths"

requirements-completed: [OUT-02, UI-02]

duration: 2min
completed: 2026-03-28
---

# Phase 05 Plan 01: Clipboard Copy Summary

**Clipboard copy for captured images with Safari Promise-ClipboardItem pattern, Firefox download fallback, and inline loading/success feedback labels in toolbar**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-28T05:13:55Z
- **Completed:** 2026-03-28T05:15:34Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Extended `useShareImage` hook with `captureAndCopy`, `copyStatus` (CopyStatus type), and `captureToBlob` shared helper
- Safari clipboard implemented using the unresolved-Promise ClipboardItem pattern; Firefox detects via `typeof ClipboardItem` and falls back to download with a status label
- Toolbar updated with clipboard copy button, disabled states on both capture buttons during capture, and transient status labels (Copied! / Saved! / Downloaded (clipboard unavailable))

## Task Commits

1. **Task 1: Add captureAndCopy + copyStatus to useShareImage hook** - `e98c418` (feat)
2. **Task 2: Wire clipboard button + loading/success feedback into toolbar and index** - `3cc2dce` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `src/hooks/useShareImage.ts` - Added captureToBlob helper, captureAndCopy method, CopyStatus type/state; refactored captureAndDownload to use captureToBlob; switched from toPng to toBlob
- `src/components/note/toolbar.tsx` - Added onCopyImage, isCapturing, copyStatus props; clipboard button with paste icon; disabled + opacity states on both capture buttons; inline status labels
- `src/components/note/index.tsx` - Destructures captureAndCopy and copyStatus from hook; adds handleCopyImage callback; passes isCapturing, copyStatus, onCopyImage to Toolbar

## Decisions Made

- Used unresolved Promise pattern for ClipboardItem: `new ClipboardItem({ 'image/png': captureToBlob() })` — Safari requires the Promise to be pending at construction time, not a resolved Blob
- Firefox detection via `typeof ClipboardItem !== 'undefined'` instead of user-agent sniffing — feature detection is more robust
- Inline status labels in toolbar instead of a toast/notification system — avoids introducing new UI infrastructure and matches the minimalist aesthetic
- Switched the entire hook from `toPng` to `toBlob` — blob is the native format for Clipboard API; converting blob to data URL via FileReader for download avoids needing two separate capture paths

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Uses native Web Clipboard API (no new dependencies).

## Next Phase Readiness

- Clipboard copy and download both fully wired
- Both Chrome/Safari (clipboard) and Firefox (download fallback) paths covered
- Phase 05 plan 01 is the only plan in this phase — phase is complete
- No blockers for next milestone

## Known Stubs

None.

---

## Self-Check

Verifying files exist and commits are present...

## Self-Check: PASSED

- `src/hooks/useShareImage.ts` - exists
- `src/components/note/toolbar.tsx` - exists
- `src/components/note/index.tsx` - exists
- Commit `e98c418` - confirmed present (feat(05-01): add captureAndCopy + copyStatus)
- Commit `3cc2dce` - confirmed present (feat(05-01): wire clipboard copy button)

---
*Phase: 05-clipboard-and-ux-polish*
*Completed: 2026-03-28*
