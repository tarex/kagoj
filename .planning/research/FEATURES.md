# Feature Research

**Domain:** Share Text as Image — writing tool screenshot/export
**Researched:** 2026-03-28
**Confidence:** HIGH (core mechanics), MEDIUM (UX patterns from analogues)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist based on analogues (Carbon, ray.so, Twitter screenshot tools). Missing these = feature feels half-baked.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Download as PNG | Every image-export tool offers this; it is the baseline action | LOW | `html-to-image` `toPng()` → trigger anchor download |
| Copy image to clipboard | Modern sharing expectation; avoids save-then-paste friction | LOW-MEDIUM | `Clipboard.write()` with `ClipboardItem` + PNG blob; requires HTTPS + user gesture; now Baseline 2025 across all modern browsers |
| Capture full note | Users expect whole-document export when nothing is selected | LOW | Pass the editor root DOM node to `html-to-image` |
| Capture selected text | Writers highlight a quote; they expect only that to export | MEDIUM | No native html-to-image API for DOM Range — requires wrapping selection in a temporary clone element, capturing it, then removing the clone |
| Preserve actual UI styling (dark bg, fonts) | Carbon/ray.so proved this is the expectation: real aesthetics, not a plain white box | MEDIUM | `html-to-image` inlines computed CSS; web fonts must be embedded — critical for Bangla script (Kalpurush / Noto Sans Bengali) |
| Entry point in existing toolbar | Icon in floating toolbar so no new navigation layer is needed | LOW | Add camera/share icon to the existing floating toolbar component; single click triggers capture |
| Visual feedback on action | "Copied!" / "Saved!" toast or icon state so user knows it worked | LOW | Transient state in the toolbar button; no extra UI needed |

### Differentiators (Competitive Advantage)

Features that go beyond generic screenshot tools and fit this app's context.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Bangla-script-aware font embedding | Bangla glyphs fail silently in html-to-image if the web font is not explicitly embedded; getting this right is invisible to users but critical | MEDIUM | Must force-fetch and embed the Bangla web font as a base64 data URI before capture; `document.fonts.ready` is not sufficient — font must be explicitly embedded in the SVG foreignObject |
| Captures real dark-UI aesthetic automatically | No customization screen; the image looks exactly like the editor — a distinct, recognizable visual identity vs. generic white-bg exports | LOW (design already exists) | Pass the `contenteditable` container; computed styles carry theme tokens; ensure CSS variables resolve correctly in the cloned SVG context |
| Selected-text highlight preserved in image | When a selection is exported, the visual highlight (or its absence) should be intentional — clean text on dark bg without browser selection blue | MEDIUM | Strip `::selection` styles or reset them before capture to avoid browser-specific selection rendering artifacts |
| 2x/devicePixelRatio scale | Retina-quality output — text looks crisp on HiDPI displays when pasted into social posts | LOW | Pass `pixelRatio: window.devicePixelRatio` option to `html-to-image` |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Customization screen (theme picker, padding sliders, font selector) | Carbon/ray.so have it; some users want control | Adds a whole UI layer (modal/panel), conflicts with the "no separate preview screen" product decision, and fragments the design identity; Carbon's customization is its product — ours is writing | Use the editor's own aesthetic as the fixed identity; no configuration needed |
| Server-side image generation (Puppeteer/headless Chrome) | Guaranteed pixel-perfect output, no font issues | Requires a server round-trip, adds infra cost, violates offline-first constraint, and introduces latency | Client-side `html-to-image` with explicit font embedding handles this for the current scope |
| Social share sheet / direct post to Twitter, Instagram | Reduces friction for social sharing | Web Share API image support is inconsistent across desktop browsers; direct social API posting requires OAuth and user accounts — out of scope for a local-first writing tool | Download + copy covers the use case; users paste where they want |
| Watermark / branding strip | Brand exposure | Adds visual weight; contradicts the clean aesthetic; users find watermarks annoying on writing exports | Rely on recognizable design identity instead |
| Animated GIF / video export | Novelty | Significant complexity; no user need identified for a text writing app | Not applicable |

## Feature Dependencies

```
[Capture selected text]
    └──requires──> [Wrap selection in clone element]
                       └──requires──> [DOM Range API + getBoundingClientRect]

[Copy to clipboard]
    └──requires──> [PNG Blob generation]
                       └──requires──> [html-to-image toPng()]

[Download PNG]
    └──requires──> [PNG data URL or Blob]
                       └──requires──> [html-to-image toPng()]

[Bangla font in image]
    └──requires──> [Explicit font embedding before capture]
                       └──requires──> [Fetch font file + base64 encode + inject into clone]

[2x pixel ratio]
    └──enhances──> [Download PNG] and [Copy to clipboard]

[Capture selected text] ──conflicts──> [Capture full note]
    (mutually exclusive: one or the other based on whether selection exists)
```

### Dependency Notes

- **Clone element approach for selections:** `html-to-image` takes a DOM node; it cannot natively capture a `Range`. The implementation must: (1) get the bounding rect of the selection, (2) clone only the relevant text nodes into a styled wrapper div, (3) capture that div, (4) remove it. This is the non-trivial part of the feature.
- **Font embedding is blocking:** If Bangla web fonts are not embedded in the SVG blob before capture, the output renders in a system fallback font, breaking the aesthetic. This must be solved before any other capture work is considered done.
- **Clipboard requires user gesture:** `navigator.clipboard.write()` must be called synchronously inside a user event handler (click). The PNG generation is async — the pattern is: start generation on click, then call clipboard write inside the `.then()` resolution, which browsers accept as "within user gesture context" in practice, but this is browser-dependent. Test in Safari.

## MVP Definition

### Launch With (v1 — this milestone)

- [x] Camera/share icon in floating toolbar
- [x] Detect whether text is selected; if yes, capture selection; if no, capture full note
- [x] `html-to-image` client-side PNG generation with explicit Bangla font embedding
- [x] Download PNG (anchor click)
- [x] Copy image to clipboard (`Clipboard.write()` with PNG blob)
- [x] 2x pixel ratio for retina output
- [x] Success feedback (transient toast or button state change)

### Add After Validation (v1.x)

- [ ] Light theme capture — if users request exporting in light mode regardless of current theme setting
- [ ] Padding/margin control — single toggle between "tight" and "comfortable" padding around the text block

### Future Consideration (v2+)

- [ ] Share sheet integration — once Web Share API image support stabilizes broadly
- [ ] Custom background color — only if brand identity request emerges from users

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Download PNG | HIGH | LOW | P1 |
| Copy to clipboard | HIGH | LOW | P1 |
| Bangla font embedding | HIGH | MEDIUM | P1 (blocking correctness) |
| Capture full note | HIGH | LOW | P1 |
| Capture selected text | MEDIUM | MEDIUM | P1 (product requirement) |
| 2x pixel ratio | MEDIUM | LOW | P1 |
| Toolbar entry point | HIGH | LOW | P1 |
| Success feedback toast | MEDIUM | LOW | P1 |
| Light-mode capture option | LOW | LOW | P3 |
| Customization screen | LOW | HIGH | Never (anti-feature) |
| Server-side generation | LOW | HIGH | Never (anti-feature) |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Carbon.now.sh | ray.so | Our Approach |
|---------|---------------|--------|--------------|
| Theming | Full customization (syntax theme, bg, padding, window style) | Curated presets, gradients | Fixed: real editor dark UI — no choice, no configuration |
| Font | Source Code Pro default, selectable | JetBrains Mono default | Kalpurush/Noto Sans Bengali — the actual editor font |
| Selection capture | No — always full editor content | No — always full editor content | Yes — detect selection, fallback to full note |
| Download | Yes (PNG, SVG) | Yes (PNG) | Yes (PNG) |
| Clipboard copy | Yes | Yes | Yes |
| Separate preview UI | Yes — entire page is the preview | Yes — entire page is the preview | No — capture happens inline from the live editor |
| Customization screen | Yes — it's the core product | Yes | Explicitly excluded |
| Input type | Code | Code | Bangla prose text |
| Share URL | Yes (snippet encoded in URL) | Yes | Not applicable |

## Key Technical Findings

**Library recommendation:** `html-to-image` — actively maintained (1.6M monthly downloads), SVG-based approach renders text more faithfully than html2canvas's canvas rasterization, TypeScript-friendly, Promise-based API. Avoid `dom-to-image` (unmaintained) and `html2canvas` (canvas rasterization degrades text quality).

**Critical Bangla rendering issue:** The `html-to-image` library serializes the DOM to SVG with a `<foreignObject>`. Web fonts referenced via `@font-face` with external URLs are not automatically inlined. For Bangla script, this is fatal — system fallback fonts almost never contain Bengali Unicode range. The font must be fetched, base64-encoded, and injected as a data URI in the clone's `<style>` block before capture. This is the highest-risk implementation detail.

**Selected text approach:** No direct API exists in `html-to-image` for `Range` objects. The practical approach: use `window.getSelection()` to get the range, `getBoundingClientRect()` to know the dimensions, clone the selected content into a positioned container that mirrors the editor's styling, capture that container, then remove it. The selected text rendering in the output should strip `::selection` pseudo-element styles to avoid blue highlight artifacts.

**Clipboard API:** `navigator.clipboard.write()` with `ClipboardItem({ 'image/png': blob })` is the correct pattern. Requires HTTPS (already satisfied on Vercel) and a user gesture. Now Baseline 2025 across Chrome, Firefox, Edge, Safari.

## Sources

- [html-to-image GitHub](https://github.com/bubkoo/html-to-image) — library choice rationale
- [html-to-image npm](https://www.npmjs.com/package/html-to-image) — download stats
- [Best HTML to Canvas Solutions 2025 — portalZINE](https://portalzine.de/best-html-to-canvas-solutions-in-2025/) — library comparison
- [npm-compare: html2canvas vs html-to-image vs dom-to-image](https://npm-compare.com/dom-to-image,html-to-image,html2canvas,screenshot-desktop) — comparison matrix
- [Clipboard API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) — browser support, write() method
- [Copy images — web.dev](https://web.dev/patterns/clipboard/copy-images) — canonical clipboard image pattern
- [Carbon about page](https://carbon.now.sh/about) — competitor feature reference
- [Carbon alternatives — snappify](https://snappify.com/blog/carbon-now-sh-alternatives) — competitive landscape
- [html-to-image font loading issue #213](https://github.com/bubkoo/html-to-image/issues/213) — known font embedding gap

---
*Feature research for: Share as Image — কাগজ Bangla writing app*
*Researched: 2026-03-28*
