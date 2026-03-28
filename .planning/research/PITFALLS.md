# Pitfalls Research

**Domain:** HTML-to-image capture for Bangla text editor (Share as Image feature)
**Researched:** 2026-03-28
**Confidence:** HIGH (verified across multiple official sources and library issue trackers)

## Critical Pitfalls

### Pitfall 1: Textarea Content Is Blank in Captured Image

**What goes wrong:**
The note editor (`src/components/note/note-editor.tsx`) uses a `<textarea>` element. Both html2canvas and html-to-image have long-standing, unresolved bugs where textarea content renders blank or as a single line in the output image. The text the user typed does not appear.

**Why it happens:**
Canvas-based capture libraries reconstruct the DOM by reading computed styles and manually re-rendering elements. Textarea text content is not in the DOM tree as child nodes — it is a form control's internal value state. Libraries either skip it, render it blank, or ignore line wrapping entirely. This is a fundamental mismatch, not a configuration issue.

**How to avoid:**
Do not attempt to screenshot the `<textarea>` directly. Before capture, clone the editor's parent container and replace the textarea with a styled `<div>` (or `<pre>`) containing the same text value. Apply identical computed styles (font, line-height, padding, color, background). Capture the clone, then discard it. This clone-and-replace approach is the only reliable workaround.

**Warning signs:**
- Captured image shows correct background/chrome but empty white text area
- Text appears as a single line regardless of content length
- Works fine in Chrome devtools element snapshot but fails in library output

**Phase to address:**
Phase 1 (core capture implementation). This is the first thing to solve before any other capture work. The entire feature depends on getting this right.

---

### Pitfall 2: html2canvas Crashes on Tailwind v4 oklch() Colors

**What goes wrong:**
This project uses Tailwind CSS v4 (`tailwindcss: ^4.2.2`). Tailwind v4 outputs all palette colors as `oklch()` by default. html2canvas does not support the `oklch()` color function and throws: `Error: Attempting to parse an unsupported color function "oklch"`. The entire capture fails with no output.

**Why it happens:**
html2canvas has a custom CSS color parser that only understands `hex`, `rgb()`, `rgba()`, `hsl()`, and `hsla()`. It has not been updated to support modern color functions despite them being standard. This project's `globals.css` uses hex and CSS custom properties (not oklch directly), but Tailwind utility classes in JSX will generate oklch values in computed styles.

**How to avoid:**
Use `html-to-image` (bubkoo) or `html2canvas-pro` instead of the base `html2canvas`. `html2canvas-pro` is a maintained fork that adds support for modern color functions including oklch, lab, lch, and oklab — the API is identical so migration is a drop-in swap. Alternatively, avoid any Tailwind utility classes in the element being captured (use only CSS custom properties from `globals.css`, which are all hex or rgb).

**Warning signs:**
- Error in console: `Attempting to parse an unsupported color function "oklch"`
- Capture returns null or throws instead of producing a blob
- Only reproducible when Tailwind utility classes touch the captured element

**Phase to address:**
Phase 1 (library selection). Choose the right library before writing any capture code.

---

### Pitfall 3: Google Fonts / next/font Not Embedded in Captured Image

**What goes wrong:**
The app loads `Noto_Sans_Bengali` and `Literata` via `next/font/google` (see `src/app/layout.tsx`). In the captured image, Bangla text falls back to a system font (or renders as boxes/tofu) because the canvas rendering library fails to embed the web fonts as base64.

**Why it happens:**
Font embedding in html-to-image works by fetching `@font-face` CSS rules and converting font files to base64. `next/font` serves fonts from the same origin (`/_next/static/media/`) with proper headers, so CORS is not the issue. The problem is timing: if the capture runs before the browser has fully loaded and painted with the custom font, the library captures the fallback font. Additionally, `html-to-image` has a known bug (versions >= 1.11.12) where `rule.style.fontFamily` can be undefined in Firefox, causing a crash during font embedding.

**How to avoid:**
Before triggering capture, call `document.fonts.ready` to ensure all fonts are loaded. Also call `document.fonts.check('16px "Noto Sans Bengali"')` to verify the specific font is available. Add a short artificial delay (100-200ms) after `fonts.ready` resolves before capture — race conditions exist even after the promise resolves. Consider pre-loading the specific font weights used in the editor.

```typescript
await document.fonts.ready;
// verify the Bangla font specifically
if (!document.fonts.check('400 16px "Noto Sans Bengali"')) {
  await new Promise(r => setTimeout(r, 200));
}
// now capture
```

**Warning signs:**
- Bangla characters appear as boxes or question marks in the output image
- Latin text renders correctly but Bangla does not
- Inconsistent results (works sometimes, fails others — timing issue)

**Phase to address:**
Phase 1 (capture implementation), specifically in the font-loading pre-check before capture is triggered.

---

### Pitfall 4: Dark Mode CSS Custom Properties Not Resolved Correctly

**What goes wrong:**
The app uses CSS custom properties on `html.dark` for dark mode (e.g., `--bg-primary: #1a1a1a`). When capturing, the library clones the DOM into an isolated context (iframe or off-screen div). That context does not inherit the `html.dark` class, so all CSS variables resolve to their light-mode values. The captured image looks like light mode even when the user is in dark mode.

**Why it happens:**
Both html2canvas and html-to-image clone the target element's subtree, not the full document. The `html.dark` class on the root element is not part of that clone. CSS custom properties cascade from the root, so without the class on the clone's root, dark variable values are never applied.

**How to avoid:**
Before cloning, read the current theme state and inline all resolved CSS custom property values directly onto the clone element as inline styles. Use `getComputedStyle(document.documentElement)` to get the resolved values and set them as `--var-name: resolved-value` on the clone. Alternatively, add the `dark` class to the clone's root element if using class-based dark mode.

```typescript
const isDark = document.documentElement.classList.contains('dark');
const cloneRoot = clonedElement;
if (isDark) {
  cloneRoot.classList.add('dark');
  // also set on html equivalent of clone context
}
```

**Warning signs:**
- Captured image always has white/light background regardless of current theme
- `--bg-primary` resolves to `#fafafa` even in dark mode
- Theme-dependent colors (text, borders, accents) all wrong in output

**Phase to address:**
Phase 1 (capture implementation). Verify by capturing in both light and dark mode before the phase is complete.

---

### Pitfall 5: Blurry Output on Retina / High-DPI Displays

**What goes wrong:**
The captured PNG appears blurry when viewed on the device that created it (retina screen, devicePixelRatio = 2 or 3). Text that looks crisp in the editor looks soft and pixelated in the downloaded image.

**Why it happens:**
HTML-to-image libraries default to a 1:1 pixel mapping. On a 2x screen, each CSS pixel represents 4 physical pixels. A 1x canvas displayed at CSS size is stretched 2x by the browser, appearing blurry.

**How to avoid:**
Pass `pixelRatio: window.devicePixelRatio` (or a minimum of 2) to the capture call. For html-to-image:
```typescript
const blob = await htmlToImage.toBlob(element, {
  pixelRatio: Math.max(window.devicePixelRatio, 2),
});
```
This increases canvas dimensions proportionally, producing a crisp image at the cost of larger file size.

**Warning signs:**
- Image looks fine on a 1x (non-retina) screen but blurry on MacBook / iPhone
- Text edges appear antialiased/soft in the downloaded PNG
- Image dimensions are smaller than expected (e.g., 800px wide instead of 1600px)

**Phase to address:**
Phase 1 (capture configuration). Set pixelRatio as a default in the capture utility from the start.

---

### Pitfall 6: Copy Image to Clipboard Fails Silently in Firefox

**What goes wrong:**
The "Copy to clipboard" action works in Chrome and Safari but does nothing (or shows a generic error) in Firefox. Firefox does not support `navigator.clipboard.write()` with image blobs for standard web pages as of early 2026.

**Why it happens:**
Firefox restricts `Clipboard.write()` with image types to browser extensions only. The standard web `Clipboard API` for images (`ClipboardItem` with `image/png` blob) is not available to regular web pages in Firefox. The API call fails or is silently ignored.

**How to avoid:**
Detect Firefox before attempting image clipboard write. Provide a fallback: either show the image in a modal with a "right-click to copy" affordance, or fall back to download-only for Firefox. Do not suppress the error silently — surface a message like "Your browser doesn't support image copying. Use the download button instead."

```typescript
const canCopyImage = typeof ClipboardItem !== 'undefined';
if (!canCopyImage) {
  // Firefox fallback: show modal or trigger download
}
```

**Warning signs:**
- No error in Chrome but silent failure in Firefox
- `ClipboardItem` is undefined in Firefox
- `navigator.clipboard.write()` rejects with `NotAllowedError` or `TypeError`

**Phase to address:**
Phase 2 (clipboard integration). Must be verified in Firefox specifically, not just Chrome.

---

### Pitfall 7: Safari Clipboard Write Requires Unresolved Promise Pattern

**What goes wrong:**
Chrome accepts `navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])` with a resolved blob. Safari requires the blob to be wrapped in an unresolved Promise inside `ClipboardItem`. Using the Chrome pattern in Safari causes a `NotAllowedError`.

**Why it happens:**
Safari's security model requires the clipboard write to happen synchronously within a user gesture. If the blob is already resolved when `ClipboardItem` is constructed, Safari considers the user gesture "consumed" by the time the write happens. Passing an unresolved Promise lets Safari keep the gesture context active while the blob resolves.

**How to avoid:**
Use browser detection or feature sniffing to use different `ClipboardItem` construction for Safari:

```typescript
// Safari requires promise pattern
const item = new ClipboardItem({
  'image/png': blobPromise, // unresolved Promise<Blob>
});

// Chrome/Edge works with resolved blob
const item = new ClipboardItem({
  'image/png': resolvedBlob,
});
```

A safe universal pattern is to always pass a Promise, which works in Safari and is also accepted by Chromium.

**Warning signs:**
- Works in Chrome, fails with `NotAllowedError` in Safari
- Only fails when capture is async (not in synchronous click handler)
- Safari logs "The request is not allowed by the user agent or the platform in the current context"

**Phase to address:**
Phase 2 (clipboard integration). Test matrix must include Safari explicitly.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Screenshot the textarea directly without cloning | No clone/replace logic | Blank content in all browsers — feature is broken | Never |
| Ignore Firefox clipboard failure silently | Simpler code path | Users in Firefox see no feedback, assume feature is broken | Never |
| Skip `document.fonts.ready` check | Faster capture trigger | Intermittent blank/tofu Bangla text in images | Never |
| Use window.devicePixelRatio without a minimum of 2 | Smaller file size | Blurry on retina screens (most modern devices) | Only if file size is a hard constraint |
| Capture the full note container including toolbar | No selection logic needed | Toolbar icons and chrome appear in shared image | Only for debugging |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| html2canvas + Tailwind v4 | Use html2canvas without checking color support | Use `html2canvas-pro` or `html-to-image` which handle oklch |
| next/font + html-to-image | Trigger capture immediately on click | `await document.fonts.ready` before every capture call |
| Clipboard API + Firefox | Test only in Chrome during development | Implement Firefox fallback (modal + download) from day one |
| Clipboard API + Safari | Pass resolved blob to ClipboardItem | Pass a Promise that resolves to the blob |
| CSS custom properties + dark mode clone | Rely on inherited variables in clone | Explicitly add `dark` class or inline resolved values on clone root |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Capturing large notes without pixelRatio cap | 10MB+ PNG for a long document, OOM on mobile | Cap pixelRatio at 2, not window.devicePixelRatio (which can be 3) | Notes > 2000 words on 3x screens |
| Blocking the main thread during capture | UI freezes during capture, spinning cursor | Use `requestAnimationFrame` + `setTimeout(0)` to yield before capture; consider Web Worker for blob processing | Any capture on low-end device |
| Re-fetching fonts on every capture | Each capture takes 2-5s loading fonts | html-to-image embeds fonts per call; precompute and cache the font stylesheet blob | Every capture call without caching |
| Cloning the full document instead of the editor section | Memory spike, slow clone | Clone only the editor content container, not `document.body` | Documents with many images/complex DOM |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Allowing CORS-tainted canvas to be exported | Canvas export fails with `SecurityError: Tainted canvases may not be exported` | Ensure all resources in captured element are same-origin or have proper CORS headers; check before capture |
| Exposing clipboard API errors to users verbatim | Browser/OS info leakage in error messages | Catch all clipboard errors and show generic "couldn't copy" message |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state during capture (capture takes 500ms-2s) | User clicks button multiple times thinking it did nothing | Show spinner or "Capturing..." state immediately on click, disable button until done |
| Downloading as "image.png" with no meaningful name | Hard to find in Downloads folder | Name file after note title + date: `[note-title]-[YYYY-MM-DD].png` |
| Offering "Copy" on Firefox with no fallback | User clicks Copy, nothing happens, no feedback | Detect Firefox, show "Download" only or explain limitation |
| Capturing the entire note container (including scrolled-off content) | Surprising to users — they expected current view | Decide explicitly: capture viewport-visible content OR full note content; make choice visible in UI |
| No success feedback after clipboard write | User unsure if Copy worked | Show brief "Copied!" toast after successful `clipboard.write()` |

---

## "Looks Done But Isn't" Checklist

- [ ] **Textarea capture:** Verify the Bangla text body actually appears in the output image (not just the background chrome)
- [ ] **Dark mode:** Capture while in dark mode — confirm the image has dark background, not light
- [ ] **Font rendering:** Confirm Bangla Unicode characters render with Noto Sans Bengali, not as boxes/tofu
- [ ] **Retina sharpness:** View the downloaded PNG at 100% zoom on a Retina screen — text should be crisp
- [ ] **Firefox clipboard:** Test "Copy" button in Firefox — a clear fallback must be visible
- [ ] **Safari clipboard:** Test "Copy" button in Safari on iPhone or macOS Safari — should work without `NotAllowedError`
- [ ] **Long note:** Capture a note with 500+ words — no content cut-off, performance is acceptable
- [ ] **Empty note:** Capture an empty or near-empty note — no crash or blank PNG
- [ ] **Light mode:** Capture in light mode — confirm white/light background, dark text

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Chose html2canvas, hit oklch crash | LOW | Swap to `html2canvas-pro` — identical API, drop-in replacement |
| Textarea capture is blank | MEDIUM | Implement clone-and-replace before capture; textarea -> div with same styles |
| Font not loading before capture | LOW | Add `await document.fonts.ready` + 150ms delay before capture call |
| Dark mode not preserved in clone | LOW | Add `dark` class to clone root element before capture |
| Firefox clipboard fails | LOW | Add `typeof ClipboardItem !== 'undefined'` check, show download fallback |
| Blurry output discovered post-launch | LOW | Add `pixelRatio: 2` to capture options, re-deploy |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Textarea content blank | Phase 1 (capture core) | Screenshot a note with 3+ paragraphs, verify text is present |
| oklch crash from Tailwind v4 | Phase 1 (library selection) | Capture fires without console errors |
| Bangla font not embedded | Phase 1 (capture implementation) | Bangla Unicode visible at correct weight in output PNG |
| Dark mode not preserved | Phase 1 (capture implementation) | Capture in dark mode, compare background color with `#1a1a1a` |
| Blurry retina output | Phase 1 (capture configuration) | View PNG at 100% zoom on MacBook Retina — crisp edges |
| Firefox clipboard failure | Phase 2 (clipboard integration) | Open in Firefox, click Copy, receive fallback UI |
| Safari clipboard pattern | Phase 2 (clipboard integration) | Click Copy in Safari iOS/macOS — no NotAllowedError |

---

## Sources

- [html2canvas Issue #1347: Text in input or textarea not capturing](https://github.com/niklasvh/html2canvas/issues/1347)
- [html2canvas Issue #3269: oklch unsupported with Tailwind CSS v4](https://github.com/niklasvh/html2canvas/issues/3269)
- [html2canvas Issue #1940: Fonts not cached causing rendering issues](https://github.com/niklasvh/html2canvas/issues/1940)
- [html-to-image Issue #213: Load fonts from document.fonts](https://github.com/bubkoo/html-to-image/issues/213)
- [html-to-image Issue #508: Firefox download broken (font undefined)](https://github.com/bubkoo/html-to-image/issues/508)
- [Capturing DOM as Image Is Harder Than You Think — monday.com Engineering](https://engineering.monday.com/capturing-dom-as-image-is-harder-than-you-think-how-we-solved-it-at-monday-com/)
- [How to copy images — web.dev Clipboard patterns](https://web.dev/patterns/clipboard/copy-images)
- [Unblocking clipboard access — web.dev](https://web.dev/articles/async-clipboard)
- [Medium: Resolving Hindi Font Rendering Issues in html2canvas](https://medium.com/@amrithraj879/resolving-hindi-font-rendering-issues-in-html2canvas-by-updating-to-the-latest-version-d23fc5816573)
- [Medium: Unsupported color function "oklch" in html2canvas + Next.js](https://medium.com/@nurmhm/unsupported-color-function-oklch-error-in-html2canvas-within-a-next-js-project-0d69037b8e85)

---
*Pitfalls research for: HTML-to-image capture, Bangla font rendering, Clipboard API — কাগজ v1.2 Share as Image*
*Researched: 2026-03-28*
