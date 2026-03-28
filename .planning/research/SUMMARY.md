# Project Research Summary

**Project:** কাগজ — Share as Image feature
**Domain:** HTML-to-image capture, Bangla web font embedding, Clipboard API, client-side PNG export
**Researched:** 2026-03-28
**Confidence:** HIGH (core implementation), MEDIUM (Safari/Firefox clipboard edge cases)

## Executive Summary

The "Share as Image" feature for কাগজ is a client-side-only capability: capture a styled DOM node as a PNG and offer download and clipboard copy. The recommended approach uses `html-to-image` (v1.11.13) — a maintained fork of dom-to-image — because it handles `@font-face` web font embedding via CSS parsing, which is critical for Bangla script. html2canvas is explicitly ruled out for two independent reasons: it fails on Tailwind v4's `oklch()` color function (a hard crash), and it has chronic unresolved issues with web font rendering. No other new dependencies are needed — clipboard and download use native browser APIs.

The highest-risk implementation detail is not the capture itself but three pre-capture concerns: (1) the editor uses a `<textarea>`, which all DOM-capture libraries render blank — a mirror `<div>` must substitute it; (2) Bangla web fonts loaded via `next/font` must be explicitly verified as loaded before capture fires, with a short delay after `document.fonts.ready` to avoid a race condition; (3) dark mode CSS custom properties will not cascade into the cloned capture context unless the `dark` class is explicitly applied to the clone root. Each of these is a silent failure mode — the capture appears to succeed but the output is wrong.

The feature maps cleanly onto the existing codebase. The `note/index.tsx` orchestrator gains two state variables and a `handleShare` callback. A new `CaptureFrame` component (an off-screen mirror div) extends the already-established `.print-content` pattern used for print. Clipboard integration requires browser-specific handling: Safari needs a `Promise`-based `ClipboardItem` pattern; Firefox does not support image clipboard writes in regular web pages and needs a graceful fallback. If these three pre-capture concerns and the two clipboard edge cases are addressed from the start, the implementation risk is low.

## Key Findings

### Recommended Stack

One new dependency is needed: `pnpm add html-to-image`. Everything else is native browser API. The package ships its own TypeScript declarations, so no `@types/` package is required. All other capture libraries are explicitly ruled out — see STACK.md for full alternatives analysis.

**Core technologies:**
- `html-to-image` v1.11.13: DOM-to-PNG capture — only library that handles `@font-face` web fonts correctly and does not crash on Tailwind v4 oklch colors
- `navigator.clipboard.write()` (native): clipboard image copy — Baseline 2025, no wrapper library needed
- Anchor + `URL.createObjectURL()` (native): PNG download — no FileSaver.js or similar needed

### Expected Features

All v1 features are P1. There are no "nice to have" items in the launch scope — the feature set is minimal and well-defined.

**Must have (table stakes):**
- Download as PNG — every image-export tool offers this; baseline expectation
- Copy image to clipboard — modern sharing expectation; avoids save-then-paste friction
- Capture full note — expected when nothing is selected
- Capture selected text — writers highlight a quote and expect only that to export
- Preserve dark UI aesthetic — the editor's visual identity must transfer to the image
- Toolbar entry point — camera/share icon in the existing floating toolbar
- Success feedback — transient "Copied!" / "Saved!" state on the button

**Should have (competitive differentiators):**
- Bangla-script-aware font embedding — critical for correctness, invisible to users when working; catastrophic when not (tofu/boxes)
- 2x pixel ratio output — retina-quality PNG for HiDPI displays

**Defer (v2+):**
- Light-mode capture option — if users explicitly request exporting against current theme
- Padding/margin toggle (tight vs comfortable)
- Web Share API integration — image support inconsistent on desktop

**Anti-features (explicitly excluded):**
- Customization screen (theme picker, font selector, padding sliders) — fragments design identity; Carbon's customization is its product, ours is writing
- Server-side generation via Puppeteer/headless Chrome — unnecessary latency and infra cost for a client-side feature
- Watermark/branding strip — conflicts with clean aesthetic

### Architecture Approach

The feature integrates into the existing component tree without structural changes. `NoteComponent` (index.tsx) gains two state variables (`shareModalOpen`, `shareSelectedText`) and a `handleShare` callback. A new `ShareImageModal` component mounts conditionally and contains a `CaptureFrame` — an off-screen mirror div styled identically to the textarea but readable by html-to-image. A `useShareImage` hook encapsulates all async capture logic. The capture frame pattern is already established in this codebase via the `.print-content` div used for print.

**Major components:**
1. `CaptureFrame` (new) — off-screen styled div that mirrors note content; workaround for textarea-capture blank-output bug; positioned at `-9999px` (never `display: none`)
2. `useShareImage` hook (new) — all async capture logic: font pre-check, html-to-image call, clipboard write, download trigger
3. `ShareImageModal` (new) — modal UI with preview and Download/Copy action buttons
4. `toolbar.tsx` (modified) — add `onShare` prop and camera/share button
5. `note/index.tsx` (modified) — add state, `handleShare` callback, mount `ShareImageModal`

**Build order (respect dependencies):**
1. `capture-frame.tsx` + CSS class (no deps)
2. `useShareImage.ts` (depends on html-to-image)
3. `share-image-modal.tsx` (depends on 1 + 2)
4. `toolbar.tsx` modification (trivial, any time)
5. `note/index.tsx` wiring (final integration, depends on all above)

### Critical Pitfalls

1. **Textarea renders blank in captured image** — Never pass `textareaRef` to html-to-image. Use a mirror `CaptureFrame` div with identical styles and the note's text value. This is Phase 1 blocker — everything else depends on getting this right first.

2. **Bangla fonts render as tofu/boxes** — Call `await document.fonts.ready` before every capture. Also check `document.fonts.check('400 16px "Noto Sans Bengali"')` and add a 150ms delay after the promise resolves — a race condition exists even after the promise settles. This is a silent failure: capture appears to succeed.

3. **Dark mode not preserved in clone** — The `html.dark` class on `<html>` does not transfer to the cloned subtree. Explicitly add `dark` class to the clone root element before capture. Verify by capturing in dark mode and checking the background color in the output.

4. **Safari clipboard `NotAllowedError`** — Safari requires `ClipboardItem({ 'image/png': blobPromise })` where `blobPromise` is an unresolved `Promise<Blob>`. Passing a resolved blob fails. Use the universal Promise pattern (works in all browsers).

5. **Firefox clipboard silent failure** — Firefox does not support `Clipboard.write()` with image types for regular web pages. `ClipboardItem` is undefined. Detect with `typeof ClipboardItem !== 'undefined'` and show a "Download" fallback with an explanation — never fail silently.

6. **Blurry output on retina screens** — Always pass `pixelRatio: Math.max(window.devicePixelRatio, 2)`. Default is 1:1 which looks soft on any HiDPI screen.

## Implications for Roadmap

Based on research, the feature naturally decomposes into two sequential phases. The dependency graph is clear: capture correctness must come before clipboard integration, because clipboard integration requires a working blob.

### Phase 1: Capture Foundation

**Rationale:** All three silent-failure modes (textarea blank, font tofu, dark mode loss) must be solved before the clipboard or download actions can be verified. If capture is broken, no amount of clipboard work matters. This phase is also self-contained and testable in isolation — temporarily render `CaptureFrame` on-screen to verify visually.

**Delivers:** A working, styled PNG blob from the note content that looks correct in dark mode, renders Bangla script in the correct font, and is retina-quality.

**Addresses:** Download PNG, Capture full note, Bangla font embedding, 2x pixel ratio, toolbar entry point, Capture selected text

**Avoids:** Textarea blank output (mirror div), font tofu (fonts.ready + delay), dark mode loss (explicit `dark` class on clone), blurry output (pixelRatio: 2), html2canvas oklch crash (use html-to-image)

**Research flag:** Standard patterns — well-documented approach, no further research needed. Build order is specified.

### Phase 2: Clipboard and UX Polish

**Rationale:** Clipboard integration is browser-specific and requires separate handling for Safari and Firefox. It logically follows Phase 1 because it consumes the blob produced there. UX polish (loading states, success feedback, filename with note title) rounds out the feature.

**Delivers:** Fully working "Copy Image" in Chrome/Edge and Safari, graceful fallback in Firefox, named downloads, loading/success feedback states.

**Addresses:** Copy image to clipboard, success feedback, Firefox graceful degradation, Safari compatibility

**Avoids:** Safari `NotAllowedError` (Promise pattern for ClipboardItem), Firefox silent failure (feature-detect + fallback UI), no loading state (button disabled + spinner during async capture)

**Research flag:** Standard patterns for Chrome/Edge. Safari and Firefox clipboard behavior is documented and confirmed — no research-phase needed. Manual cross-browser testing required.

### Phase Ordering Rationale

- Phase 1 before Phase 2: capture blob must exist and be correct before clipboard writing is tested. Debugging "why is clipboard empty" while capture is also broken compounds failures.
- Selected text capture belongs in Phase 1 because it requires the `CaptureFrame` architecture to be in place — the selection slice is just a different value passed to the same component.
- No Phase 3 needed for v1 — all P1 features fit in two phases. v1.x additions (light-mode capture toggle, padding option) are small enough to add as standalone tasks after validation.

### Research Flags

Phases with standard patterns (skip research-phase):
- **Phase 1:** Mirror div for textarea, off-screen positioning, `document.fonts.ready` pattern — all well-documented. Build order is explicit in ARCHITECTURE.md.
- **Phase 2:** Clipboard patterns for all three browsers are fully documented in STACK.md and PITFALLS.md with code examples.

No phases require a `/gsd:research-phase` call. All unknowns are resolved.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | One library. Official GitHub, npm stats, MDN for clipboard. All alternatives explicitly evaluated and ruled out. |
| Features | HIGH | Small, well-scoped feature. Table stakes clear from Carbon/ray.so analysis. Anti-features explicit. |
| Architecture | HIGH | Directly informed by existing codebase patterns (`.print-content` div). Component structure is specific, not generic. |
| Pitfalls | HIGH | Each pitfall sourced from official issue trackers or verified community sources. Code examples provided for all mitigations. |

**Overall confidence:** HIGH

### Gaps to Address

- **Firefox clipboard baseline:** PITFALLS.md states Firefox does not support image clipboard for web pages as of early 2026. STACK.md and FEATURES.md reference Baseline 2025 support. This contradiction should be verified against current MDN browser compatibility table during Phase 2 implementation. If Firefox has shipped support, the fallback can be simplified; if not, the fallback is required.
- **html-to-image `rule.style.fontFamily` crash (Firefox):** Issue #508 notes a crash in Firefox during font embedding in versions >= 1.11.12. This needs manual verification at implementation time — if reproduced, wrapping the capture call in a try/catch and retrying without font embedding is the recovery path.
- **Selection read on toolbar click:** The implementation must read `textarea.selectionStart / selectionEnd` synchronously in the click handler, before any React state update causes re-render and focus loss. This is documented in ARCHITECTURE.md but is an easy mistake in practice — verify in the integration test.

## Sources

### Primary (HIGH confidence)
- [html-to-image GitHub](https://github.com/bubkoo/html-to-image) — API surface, font embedding mechanism, `toBlob`/`toPng` options
- [MDN Clipboard.write()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write) — write() method, browser support
- [html2canvas Issue #3269](https://github.com/niklasvh/html2canvas/issues/3269) — oklch crash confirmed
- [html2canvas Issue #1347](https://github.com/niklasvh/html2canvas/issues/1347) — textarea blank content confirmed
- Existing codebase `.print-content` div — confirms mirror div pattern is already established

### Secondary (MEDIUM confidence)
- [web.dev ClipboardItem.supports() Baseline](https://web.dev/blog/baseline-clipboard-item-supports) — Baseline March 2025 status
- [Safari Clipboard async workaround](https://wolfgangrittner.dev/how-to-use-clipboard-api-in-safari/) — Promise pattern for ClipboardItem
- [html-to-image Issue #213](https://github.com/bubkoo/html-to-image/issues/213) — font loading timing gap
- [html-to-image Issue #508](https://github.com/bubkoo/html-to-image/issues/508) — Firefox `rule.style.fontFamily` undefined crash
- [monday.com Engineering: Capturing DOM as Image](https://engineering.monday.com/capturing-dom-as-image-is-harder-than-you-think-how-we-solved-it-at-monday-com/) — real-world validation of pitfalls

### Tertiary (LOW confidence)
- [Better Programming: html2canvas vs html-to-image](https://medium.com/better-programming/heres-why-i-m-replacing-html2canvas-with-html-to-image-in-our-react-app-d8da0b85eadf) — directionally confirms font issues but single source

---
*Research completed: 2026-03-28*
*Ready for roadmap: yes*
