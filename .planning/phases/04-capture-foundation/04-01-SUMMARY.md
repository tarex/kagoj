---
phase: 04-capture-foundation
plan: 01
subsystem: ui
tags: [html-to-image, react, hooks, png-capture, bangla, dark-mode, fonts]

requires: []
provides:
  - CaptureFrame off-screen mirror div component for html-to-image targeting
  - useShareImage hook with font pre-check, PNG capture, and browser download
  - html-to-image 1.11.13 dependency installed
affects: [04-02, 05-share-ui, toolbar]

tech-stack:
  added: [html-to-image 1.11.13]
  patterns:
    - Off-screen mirror div at left -9999px (not display:none) for html-to-image capture
    - Font pre-check with document.fonts.ready plus 150ms race-condition delay
    - Firefox crash recovery: retry toPng without filter on fontFamily error (Issue #508)

key-files:
  created:
    - src/components/note/capture-frame.tsx
    - src/hooks/useShareImage.ts
  modified:
    - package.json

key-decisions:
  - "Off-screen positioning via left:-9999px not display:none — html-to-image cannot capture hidden elements"
  - "Hardcode dark background (#1a1a1a) in CaptureFrame — dark mode is the export aesthetic, no customization"
  - "150ms delay after document.fonts.ready — race condition exists even after promise settles (per research)"
  - "Firefox Issue #508 retry without filter when toPng throws fontFamily/style error"

patterns-established:
  - "CaptureFrame follows same aria-hidden mirror pattern as print-content div in note/index.tsx"
  - "useShareImage returns captureRef to attach to CaptureFrame, keeping capture logic in hook"

requirements-completed: [CAPT-01, CAPT-03, CAPT-04]

duration: 8min
completed: 2026-03-28
---

# Phase 04 Plan 01: Capture Foundation Summary

**html-to-image capture pipeline: off-screen CaptureFrame mirror div with dark Bangla styling and useShareImage hook with font pre-check, retina PNG capture, Firefox crash recovery, and browser download**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-28T05:00:00Z
- **Completed:** 2026-03-28T05:08:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Installed html-to-image 1.11.13 (only DOM-capture library that handles @font-face and Tailwind v4 oklch correctly)
- Created CaptureFrame component: off-screen div at left -9999px with dark background (#1a1a1a), Bangla font family, 32px padding, pre-wrap whitespace
- Created useShareImage hook: document.fonts.ready + 150ms delay + toPng with retina pixelRatio + Firefox retry + anchor download

## Task Commits

1. **Task 1: Install html-to-image and create CaptureFrame component** - `d7e5397` (feat)
2. **Task 2: Create useShareImage hook with font pre-check, capture, and download** - `bf2bbbd` (feat)

**Plan metadata:** (final docs commit hash — see below)

## Files Created/Modified

- `src/components/note/capture-frame.tsx` - Off-screen mirror div component for html-to-image targeting, dark styling, Bangla font
- `src/hooks/useShareImage.ts` - Capture hook: font pre-check, toPng call, Firefox workaround, download via anchor
- `package.json` - Added html-to-image 1.11.13 dependency

## Decisions Made

- Off-screen positioning uses `position: fixed; left: -9999px` — html-to-image requires element to be in layout flow, display:none prevents capture
- CaptureFrame hardcodes dark background (#1a1a1a / #e8e8e8) — dark aesthetic is the intended export style per project decision, no light/custom mode
- 150ms post-fonts.ready delay is mandatory — browser race condition means font CSS may not be fully applied even after the promise resolves
- Firefox Issue #508 retry: if toPng throws with 'fontFamily' or 'style' in message, retry without filter callback — workaround for Firefox rule.style.fontFamily crash in html-to-image >= 1.11.12

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CaptureFrame and useShareImage are the complete capture pipeline foundation
- Phase 04 Plan 02 can integrate CaptureFrame into note/index.tsx and wire the toolbar button
- captureRef from useShareImage attaches to CaptureFrame; captureAndDownload(title) triggers the full pipeline
- isCapturing state available for Phase 5 UI feedback (spinner/disabled state)

## Self-Check: PASSED

All files verified on disk. All task commits verified in git history.

---
*Phase: 04-capture-foundation*
*Completed: 2026-03-28*
