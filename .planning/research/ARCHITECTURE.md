# Architecture Research

**Domain:** HTML-to-image capture integrated into existing React text editor
**Researched:** 2026-03-28
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    NoteComponent (index.tsx)                     │
│                    [orchestrator — all state lives here]         │
├──────────────┬──────────────────────────────┬───────────────────┤
│   Toolbar    │       Editor Area             │  Capture System   │
│  (existing)  │       (existing)              │  (NEW)            │
│              │                              │                   │
│  [Share btn] │  .editor-main                │  useShareImage    │
│      |       │    note-title-input          │  hook             │
│      v       │    .editor-wrapper           │      |            │
│  triggers    │      NoteEditor (textarea)   │      v            │
│  capture     │      .print-content (div)    │  ShareImageModal  │
│              │      GhostText               │  component        │
│              │      WordSuggestionPopup     │      |            │
│              │                              │      v            │
│              │  [captureRef attached here]  │  html-to-image    │
└──────────────┴──────────────────────────────┴───────────────────┘
```

### Component Responsibilities

| Component | Responsibility | New or Existing |
|-----------|----------------|-----------------|
| `Toolbar` | Hosts the share button; passes `onShare` callback | Modified |
| `NoteComponent` | Owns capture ref, selection state, `handleShare` | Modified |
| `useShareImage` | Encapsulates capture logic: read selection, build capture node, call html-to-image, download/clipboard | New hook |
| `ShareImageModal` | Renders the off-screen styled capture container; shows preview + action buttons | New component |
| `.capture-frame` div | Off-screen styled div that mirrors note content for screenshot; avoids the textarea rendering bug | New DOM node |

## Recommended Project Structure

```
src/
├── components/
│   └── note/
│       ├── index.tsx           # Modified: add captureRef, handleShare, onShare prop to Toolbar
│       ├── toolbar.tsx         # Modified: add share button, onShare prop
│       ├── share-image-modal.tsx  # New: preview modal with download/copy buttons
│       └── capture-frame.tsx      # New: styled div that renders note text for screenshot
├── hooks/
│   └── useShareImage.ts           # New: all capture logic
└── lib/
    └── (no new lib files needed)
```

### Structure Rationale

- **`useShareImage.ts`:** Capture is async, involves DOM manipulation, and has multiple output paths (download vs clipboard). A hook keeps `NoteComponent` clean and lets the logic be tested in isolation.
- **`capture-frame.tsx`:** The textarea is a replaced element — html-to-image (and html2canvas) do not render its `.value` content; they render only what is in the DOM attribute. A mirror div with the same text solves this. The existing codebase already does exactly this for print via `.print-content`. The capture frame extends that pattern with full styling.
- **`share-image-modal.tsx`:** Separating the modal from the hook keeps rendering concerns out of the hook and makes the UI independently changeable.

## Architectural Patterns

### Pattern 1: Mirror Div for Textarea Capture

**What:** The textarea's displayed text is never in the DOM in a way html-to-image can read — it lives in the `.value` JS property. Create a sibling `<div>` with `aria-hidden="true"` containing `currentNote`, styled identically to `.text-editor`, and point html-to-image at that div.

**When to use:** Any time you need to screenshot a textarea. This is the standard industry fix.

**Trade-offs:** You maintain two elements with the same text, but the div is off-screen so no visual duplication. The codebase already does this for print (`.print-content` div).

**Example:**
```typescript
// capture-frame.tsx
interface CaptureFrameProps {
  text: string;
  title: string;
  fontSize: number;
  captureRef: React.RefObject<HTMLDivElement>;
  selectedText?: string; // if set, render only this
}

export const CaptureFrame = React.forwardRef<HTMLDivElement, CaptureFrameProps>(
  ({ text, title, fontSize, selectedText }, ref) => {
    const content = selectedText ?? text;
    return (
      <div
        ref={ref}
        className="capture-frame"
        aria-hidden="true"
        style={{ fontSize }}
      >
        {title && <div className="capture-frame-title">{title}</div>}
        <div className="capture-frame-body">{content}</div>
        <div className="capture-frame-branding">কাগজ</div>
      </div>
    );
  }
);
```

### Pattern 2: Off-Screen Render, Then Capture

**What:** Position the capture frame absolutely off-screen (`position: fixed; left: -9999px; top: -9999px`) while html-to-image reads it, then remove or hide it after capture. Never set `display: none` — the library cannot measure hidden elements.

**When to use:** Whenever you need a styled node that is not visible to the user but must be measurable by the DOM.

**Trade-offs:** The node is in the DOM briefly during capture. Keep it mounted only while the modal is open to avoid layout thrash.

**Example:**
```typescript
// useShareImage.ts
export function useShareImage() {
  const captureRef = useRef<HTMLDivElement>(null);

  const captureAsBlob = async (): Promise<Blob> => {
    const node = captureRef.current;
    if (!node) throw new Error('Capture frame not mounted');
    // pixelRatio: 2 gives retina-quality output
    return toPng(node, { pixelRatio: 2 });
  };

  const download = async (filename: string) => {
    const dataUrl = await toPng(captureRef.current!, { pixelRatio: 2 });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const copyToClipboard = async () => {
    const blob = await toBlob(captureRef.current!, { pixelRatio: 2 });
    if (!blob) throw new Error('Capture failed');
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
  };

  return { captureRef, download, copyToClipboard };
}
```

### Pattern 3: Selection-Aware Capture

**What:** When the user has text selected in the textarea at the moment they press Share, pass only that selection slice to `CaptureFrame`. Otherwise pass the full `currentNote`.

**When to use:** "Capture selected text" feature.

**Trade-offs:** Must read `textareaRef.current.selectionStart / selectionEnd` at the moment the toolbar button is clicked — before the button click causes the textarea to lose focus. Capture the selection in the `handleShare` callback before any state update.

**Example:**
```typescript
// in NoteComponent
const handleShare = useCallback(() => {
  const textarea = textareaRef.current;
  const selectedText =
    textarea && textarea.selectionStart !== textarea.selectionEnd
      ? textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)
      : undefined;
  setShareSelectedText(selectedText); // new state
  setShareModalOpen(true);
}, []);
```

## Data Flow

### Share Capture Flow

```
User clicks Share button in Toolbar
    |
    v
handleShare() in NoteComponent
    - reads textarea.selectionStart / selectionEnd
    - captures selectedText (or undefined for full note)
    - sets shareModalOpen = true
    |
    v
ShareImageModal renders (receives text, title, fontSize, selectedText)
    - mounts CaptureFrame off-screen with those props
    - shows preview (optional: inline canvas preview)
    - shows "Download PNG" and "Copy Image" buttons
    |
    v
User clicks Download or Copy
    - useShareImage.download() or .copyToClipboard()
    - calls html-to-image toPng / toBlob on captureRef
    - returns data URL / Blob
    - triggers browser download or Clipboard API write
```

### State Changes in NoteComponent

Two new pieces of state needed:

| State | Type | Purpose |
|-------|------|---------|
| `shareModalOpen` | `boolean` | Controls whether ShareImageModal + CaptureFrame are mounted |
| `shareSelectedText` | `string \| undefined` | The selection slice at click time; undefined = full note |

No changes to existing state. No changes to localStorage keys.

## Integration Points

### Modified Components

| File | Change | Scope |
|------|--------|-------|
| `toolbar.tsx` | Add `onShare` prop, add camera/share button SVG | Small — one new prop, one new `ToolbarBtn` |
| `note/index.tsx` | Add two state vars, `handleShare` callback, mount `ShareImageModal` in JSX | Medium — adds ~30 lines |

### New Components

| File | What | Depends On |
|------|------|------------|
| `share-image-modal.tsx` | Modal with preview + action buttons | `useShareImage`, `CaptureFrame` |
| `capture-frame.tsx` | Off-screen styled div for screenshot | CSS class `.capture-frame` |
| `hooks/useShareImage.ts` | Capture logic | `html-to-image` library |

### External Library

| Library | Install | Purpose |
|---------|---------|---------|
| `html-to-image` | `pnpm add html-to-image` | Converts a DOM node to PNG data URL or Blob |

Note: `puppeteer` is already in `devDependencies` but it is a server-side tool unsuitable for client-side browser capture. `html-to-image` is the correct browser-side solution.

### CSS

Add `.capture-frame` class to `globals.css` that matches `.text-editor` styling (font, color, background, padding, line-height) but with `position: fixed; left: -9999px; top: -9999px; white-space: pre-wrap; word-break: break-word`. This ensures the screenshot matches the editor appearance.

### Clipboard API

`navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])` is supported in all modern browsers as of March 2025 (Baseline Newly Available). No polyfill needed. Requires HTTPS — Vercel deployments are HTTPS so this is satisfied.

## Anti-Patterns

### Anti-Pattern 1: Capturing the Textarea Directly

**What people do:** Pass `textareaRef` to html-to-image directly.

**Why it's wrong:** Textareas are replaced elements. Their `.value` content is not part of the paintable DOM tree. html-to-image and html2canvas both render a blank textarea. This is a documented, unfixed limitation.

**Do this instead:** Use a mirror div (`CaptureFrame`) with identical styling. The codebase already proves this works — `.print-content` div exists for exactly this reason.

### Anti-Pattern 2: `display: none` on the Capture Frame

**What people do:** Hide the off-screen capture div with `display: none` to keep it invisible.

**Why it's wrong:** html-to-image cannot measure or render elements with `display: none`. The output will be a zero-size or blank image.

**Do this instead:** Use `position: fixed; left: -9999px` — the element is off-screen but still measurable.

### Anti-Pattern 3: Opening a New Window or Preview Route

**What people do:** Navigate to a `/preview` route or open a popup to show the shareable version, then screenshot it.

**Why it's wrong:** Adds routing complexity, loses access to current editor state, breaks back-navigation UX, and is unnecessary since the off-screen div approach works in-page.

**Do this instead:** Mount `CaptureFrame` conditionally in the same component tree when the modal is open.

### Anti-Pattern 4: Reading Selection After Modal Opens

**What people do:** Try to read `textarea.selectionStart` inside the modal or after `setShareModalOpen(true)`.

**Why it's wrong:** Opening the modal (or any React state update) causes a re-render, which may shift focus away from the textarea, resetting the selection to 0.

**Do this instead:** Read selection synchronously in the click handler before any state update, then store it in `shareSelectedText` state.

## Build Order

Build in this order to respect dependencies:

1. **`capture-frame.tsx` + CSS class** — no dependencies, can be built and visually tested in isolation by temporarily rendering it on-screen.
2. **`hooks/useShareImage.ts`** — depends on `html-to-image` (install first) and `captureRef`. No React rendering dependencies.
3. **`share-image-modal.tsx`** — depends on `CaptureFrame` and `useShareImage`. Build after both.
4. **`toolbar.tsx` modification** — trivial prop addition; can be done any time but needs to land before the final wiring step.
5. **`note/index.tsx` wiring** — mount `ShareImageModal`, add state, add `handleShare`. Final integration step; depends on all above.

This order means each step is testable before the next begins.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (single user, localStorage) | Off-screen div approach is sufficient. No server involvement needed. |
| Future: server-side OG image gen | If needed later, pass note content to a Next.js API route using `@vercel/og` / `ImageResponse` — entirely separate from this client-side flow. |
| Future: share link | Out of scope per PROJECT.md. Would require backend persistence. |

## Sources

- [html-to-image GitHub](https://github.com/bubkoo/html-to-image) — API, pixelRatio option, toBlob/toPng
- [Clipboard API MDN — write()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write) — PNG image write, browser support baseline March 2025
- [Better Programming: html2canvas vs html-to-image](https://medium.com/better-programming/heres-why-i-m-replacing-html2canvas-with-html-to-image-in-our-react-app-d8da0b85eadf) — comparison, recommendation
- [html2canvas textarea issue #1347](https://github.com/niklasvh/html2canvas/issues/1347) — confirms textarea content not captured; same limitation applies to html-to-image
- Existing codebase: `.print-content` div in `note/index.tsx` line 1033 — confirms the mirror div pattern is already established in this project

---
*Architecture research for: Share as Image — কাগজ Bangla writing app*
*Researched: 2026-03-28*
