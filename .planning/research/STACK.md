# Stack Research

**Domain:** HTML-to-image capture, clipboard image copy, PNG download in Next.js/React
**Researched:** 2026-03-28
**Confidence:** HIGH (core library), MEDIUM (Safari clipboard workaround)

## Scope

This covers ONLY the new capabilities needed for "Share as Image". The existing stack (Next.js 16, React 19, TypeScript 5.9, Tailwind CSS 4, Vercel AI SDK) is unchanged and not repeated here.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `html-to-image` | 1.11.13 | Captures a DOM node as PNG, Blob, or SVG | Modern fork of dom-to-image. Handles web font embedding via `@font-face` CSS parsing, base64-inlining fonts into SVG foreignObject. Significantly better font handling than html2canvas, which consistently fails on custom/web fonts. No new deps needed beyond the single package. |

### Supporting Libraries

None required. All other capabilities (clipboard, download) are native browser APIs available in the target runtime.

| Capability | Approach | Why |
|------------|----------|-----|
| Copy to clipboard | `navigator.clipboard.write()` + `ClipboardItem` (native) | Baseline Newly Available as of March 2025 -- all modern browsers support `image/png`. No wrapper library needed. |
| PNG download | Anchor element with `download` attribute + `URL.createObjectURL()` (native) | Standard pattern. No library. |

## No New Libraries

The feature requires exactly one new dependency: `html-to-image`.

```bash
pnpm add html-to-image
```

No `@types/html-to-image` needed -- the package ships its own TypeScript declarations.

## Integration Points

### 1. DOM Capture

Use `toBlob()` (not `toPng()`). `toBlob` is more flexible -- you get a `Blob`, which clipboard API and `URL.createObjectURL` both accept directly.

```typescript
import { toBlob } from 'html-to-image';

const blob = await toBlob(editorRef.current, {
  pixelRatio: 2,               // retina quality
  backgroundColor: undefined,  // inherit actual background (dark theme)
  preferredFontFormat: 'woff2',
});
```

Key option: `pixelRatio: 2` for retina-quality output without changing layout. `backgroundColor: undefined` means the element's actual CSS background is preserved -- no need to manually specify dark colors.

### 2. Font Loading -- Critical

The editor uses Bangla fonts loaded as web fonts. `html-to-image` embeds fonts by parsing `@font-face` declarations and downloading them. This is async but happens automatically. However, fonts must be fully loaded before capture.

Use `document.fonts.ready` before triggering capture:

```typescript
await document.fonts.ready;
const blob = await toBlob(editorRef.current, { pixelRatio: 2 });
```

### 3. Clipboard Copy -- Safari Workaround Required

Safari blocks `clipboard.write()` called inside an `async` callback (after `await`). The workaround is to pass a `Promise` directly into `ClipboardItem` instead of awaiting first.

```typescript
// Works in Chrome, Firefox, Safari
const blobPromise = toBlob(editorRef.current, { pixelRatio: 2 });
await navigator.clipboard.write([
  new ClipboardItem({ 'image/png': blobPromise })
]);
```

By passing the unresolved `Promise` directly to `ClipboardItem`, the clipboard operation stays within the synchronous user gesture context (Safari requirement) while the blob resolves internally.

`ClipboardItem.supports('image/png')` returns `true` by spec mandate for all compliant browsers -- no feature detection guard needed for PNG specifically.

### 4. PNG Download

```typescript
const blob = await toBlob(editorRef.current, { pixelRatio: 2 });
const url = URL.createObjectURL(blob!);
const a = document.createElement('a');
a.href = url;
a.download = 'kagaj-note.png';
a.click();
URL.revokeObjectURL(url);
```

No FileSaver.js or other library needed.

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `html-to-image` | `html2canvas` | html2canvas has persistent open issues with web fonts and custom fonts (many GitHub issues unresolved since 2018). Our editor uses Bangla web fonts -- this is a high-probability failure point. html-to-image embeds fonts via CSS parsing rather than re-rendering them on canvas, which is more reliable. |
| `html-to-image` | `dom-to-image` | dom-to-image (the original) is unmaintained since 2019. html-to-image is its maintained fork. |
| `html-to-image` | `@hugocxl/react-to-image` | Adds a React wrapper around html-to-image. Unnecessary abstraction -- we use refs directly and don't need hook wrappers. Extra dep for no gain. |
| `html-to-image` | `snapdom` | Newer alternative (2024-2025), less proven, smaller ecosystem. html-to-image has 1.6M weekly downloads and wider real-world validation. |
| Native Clipboard API | `clipboard` npm package | The npm `clipboard` package is for text only. For image blobs we need the native async Clipboard API. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `html2canvas` | Chronic web font rendering failures. Open GitHub issues since 2018 on custom font support. Bangla fonts loaded via `@font-face` will likely render as system fallbacks. | `html-to-image` |
| `dom-to-image` | Unmaintained since 2019. | `html-to-image` (its maintained fork) |
| Server-side capture (Puppeteer, headless Chrome) | Puppeteer is already a devDependency but server-side capture adds latency, requires API route, and is overkill for a client-side-only feature. The content is already rendered in the browser. | `html-to-image` (client-side) |
| FileSaver.js | Unnecessary. The anchor + `URL.createObjectURL` pattern handles PNG download natively in all modern browsers. | Native anchor download |
| `react-hot-toast` or any notification library | Not needed for this feature -- inline feedback (button state change) is sufficient. | CSS state classes |

## Known Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| `html-to-image` does not render CSS `::before`/`::after` pseudo-elements reliably | Low -- editor does not rely on pseudo-elements for visible content | Audit editor DOM for pseudo-element use before shipping |
| Safari clipboard requires `ClipboardItem(Promise)` pattern | Medium -- wrong pattern will silently fail | Use the synchronous-gift-of-promise pattern shown above |
| `html-to-image` version 1.11.13 was last published ~1 year ago | Low -- stable, widely used, no active bugs affecting our case | Pin to 1.11.13, no upgrade pressure |
| Very long notes may produce large PNG files | Low -- typical notes are short | No mitigation needed; let users experience naturally |

## Version Compatibility

| Package | Version | Compatibility Notes |
|---------|---------|---------------------|
| `html-to-image` | 1.11.13 | Works with React 19, no DOM API conflicts. Ships own TS types. |
| Native Clipboard API | Browser API | Baseline Newly Available March 2025. Chrome 76+, Firefox 127+, Safari 13.1+. PNG mandated by spec. |

## Sources

- [html-to-image GitHub](https://github.com/bubkoo/html-to-image) -- API surface, font embedding mechanism, options
- [MDN Clipboard.write()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write) -- MEDIUM confidence (official spec)
- [web.dev ClipboardItem.supports() Baseline](https://web.dev/blog/baseline-clipboard-item-supports) -- Baseline status March 2025
- [Safari Clipboard async workaround](https://wolfgangrittner.dev/how-to-use-clipboard-api-in-safari/) -- MEDIUM confidence (community verified)
- [Here's Why I'm Replacing html2canvas With html-to-image](https://medium.com/better-programming/heres-why-i-m-replacing-html2canvas-with-html-to-image-in-our-react-app-d8da0b85eadf) -- LOW confidence (single source, directionally confirms font issues)
- [html2canvas font issues GitHub](https://github.com/niklasvh/html2canvas/issues/3198) -- MEDIUM confidence (official issue tracker)

---
*Stack research for: Share as Image feature -- HTML capture, clipboard, PNG download*
*Researched: 2026-03-28*
