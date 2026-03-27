# Coding Conventions

**Analysis Date:** 2025-03-27

## Naming Patterns

**Files:**
- React components: PascalCase + `.tsx` (e.g., `NoteComponent.tsx`, `NoteEditor.tsx`, `Toolbar.tsx`)
- Utilities and hooks: camelCase + `.ts` (e.g., `useSpellCheck.ts`, `useDebounce.ts`, `use-notes.ts`)
- Library modules: kebab-case + `.ts` (e.g., `bangla-input-handler.ts`, `context-pattern.ts`, `local-spell-checker.ts`)
- API routes: lowercase + `route.ts` (e.g., `/api/suggestions/route.ts`)

**Functions:**
- Camelcase for all functions: `processInputKeyPress`, `handleKeyPress`, `transliterate`, `checkSpelling`
- Hook functions follow React convention: `useNotes`, `useSpellCheck`, `useDebounce`
- Callback functions with `handle` prefix: `handleChange`, `handleKeyPress`, `handleCorrection`, `handleIgnoreSpelling`
- Private methods with underscore: `_calculateMaxPatternLength`, `_loadFromStorage`, `_saveToStorage`
- Async operations often prefixed with action: `checkSpelling`, `scheduleSpellCheck`, `learnFromText`

**Variables:**
- State variables: camelCase (e.g., `currentNote`, `isBanglaMode`, `spellingErrors`)
- Constants (uppercase): `FONT_SIZE_KEY`, `DEFAULT_FONT_SIZE`, `SAVE_THROTTLE_TIME`, `MIN_WORD_LENGTH`, `MAX_LEARNED_WORDS`
- Ref objects: camelCase + `Ref` suffix (e.g., `textareaRef`, `saveTimeoutRef`, `spellCheckTimeoutRef`)
- Boolean flags: `is`/`has` prefix (e.g., `isActive`, `isDarkMode`, `isCheckingSpelling`, `hasOverlay`)

**Types:**
- Interface definitions: PascalCase with "Props" suffix for component props: `ToolbarProps`, `NoteEditorProps`
- Type interfaces: PascalCase descriptive names (e.g., `TransliterationRule`, `SpellingError`, `Note`, `WordFrequency`)
- Enum-like objects treated as constants: `RECOGNIZED_KEYS`

## Code Style

**Formatting:**
- No explicit `.prettierrc` configured; ESLint handles formatting via `eslint.config.mjs`
- Uses Next.js core-web-vitals and TypeScript recommended rules
- Target: ES2017 with ESNext modules

**Linting:**
- Framework: ESLint with Next.js config (`next/core-web-vitals`, `next/typescript`)
- Configuration: `eslint.config.mjs` (flat config format)
- Strict TypeScript mode enabled in `tsconfig.json`
- No `any` type allowed in production code

**Comment Style:**
- JSDoc style for public class methods:
  ```typescript
  /**
   * Modern implementation of Bangla Input Method Editor
   * Handles phonetic typing conversion from English to Bangla characters
   */
  ```
- Inline comments for complex logic use double-slash: `// If user is holding down a modifier key...`
- Multi-line comments above functions: `// Comment explaining the following block`

## Import Organization

**Order:**
1. External libraries (React, React DOM, third-party packages)
2. Local components (relative imports from components/)
3. Hooks (from hooks/)
4. Libraries and utilities (from lib/)
5. Types/interfaces (local or from shared files)

**Example pattern from `src/components/note/index.tsx`:**
```typescript
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { NoteList } from './note-list';
import { NoteEditor } from './note-editor';
import { useNotes } from './use-notes';
import { useSpellCheck } from '@/hooks/useSpellCheck';
import { useDebounce } from '@/hooks/useDebounce';
import { BanglaInputHandler } from '@/lib/bangla-input-handler';
```

**Path Aliases:**
- `@/*` maps to `./src/*` (defined in `tsconfig.json`)
- All internal imports use the `@/` prefix for clarity

## Error Handling

**Patterns:**
- Try-catch blocks for JSON parsing and async operations:
  ```typescript
  try {
    const savedNotes = JSON.parse(localStorage.getItem('notes') || '[]');
  } catch (error) {
    console.error('Failed to parse notes from local storage:', error);
    setNotes([]);
  }
  ```

- Guard clauses for null/undefined checks:
  ```typescript
  if (!inputElement) {
    return;
  }
  ```

- Early returns to prevent nested conditionals:
  ```typescript
  if (!text || text.trim().length < 3 || !isBanglaMode) {
    return;
  }
  ```

- Console logging for debugging (error, warn, info levels used):
  ```typescript
  console.error('❌ Spell check error:', error);
  console.log('✅ Local spell check complete');
  console.warn('Word position has changed...');
  ```

- Environment variable checks for feature flags:
  ```typescript
  if (process.env.NEXT_PUBLIC_DISABLE_SPELL_CHECK === 'true') {
    return;
  }
  ```

## Logging

**Framework:** Native `console` object (no logging library)

**Patterns:**
- Error logs: `console.error('message', error)`
- Info logs: `console.log('message')`
- Warning logs: `console.warn('message')`
- Emoji prefixes for visual scanning: `❌`, `✅`, `🔍`, `📋`
- Browser console listener in test files:
  ```typescript
  page.on('console', msg => {
    console.log('Browser Console:', msg.type(), msg.text());
  });
  ```

## Comments

**When to Comment:**
- Complex Bangla phonetic pattern matching logic in `context-pattern.ts`
- State management flow in `use-notes.ts` (e.g., when saving vs. creating notes)
- Event handler logic that involves multiple steps
- Non-obvious algorithm choices

**JSDoc Usage:**
- Public class methods in `BanglaInputHandler`:
  ```typescript
  /**
   * Modern implementation of Bangla Input Method Editor
   * Handles phonetic typing conversion from English to Bangla characters
   */
  ```
- Hook return types are inferred but documented via interface returns
- Private methods sometimes have inline comments above them

## Function Design

**Size:**
- Keep functions under 20-25 logical statements (observed in codebase)
- Single responsibility: `transliterate()`, `handleKeyPress()`, `checkSpelling()` each have one job
- Extract utility functions when logic is reused

**Parameters:**
- Destructure props in React components using TypeScript interfaces:
  ```typescript
  export const Toolbar: React.FC<ToolbarProps> = React.memo(({
    onFormatBold,
    onFormatItalic,
    ...
  }) => { ... })
  ```
- Use callback parameters for event handlers: `(e: React.KeyboardEvent<HTMLInputElement>) => void`
- Callback functions as props: `onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void`

**Return Values:**
- Functions explicitly return typed values (no implicit `undefined`)
- Void functions for side-effect handlers: `handleChange(): void`
- Typed return values for utilities: `getSuggestions(word: string, limit: number): string[]`

## Module Design

**Exports:**
- Named exports for components and utilities:
  ```typescript
  export const NoteComponent: React.FC = () => { ... }
  export const useSpellCheck = (isBanglaMode: boolean) => { ... }
  ```
- Default exports for pages in Next.js (`/src/app/page.tsx`, `/src/app/layout.tsx`)
- Singleton pattern for stateful utilities:
  ```typescript
  export class BanglaInputHandler {
    private static instance: BanglaInputHandler;
    public static getInstance(): BanglaInputHandler { ... }
  }
  ```

**Barrel Files:**
- Not extensively used; imports are direct from source files
- Re-exports in component subdirectories (e.g., `index.tsx` as main export)

## Type System

**Strict Mode:**
- TypeScript strict mode enabled (`"strict": true` in tsconfig.json)
- All interfaces explicitly defined for props, state, and data structures
- No implicit `any` types allowed
- Function signatures include parameter and return types:
  ```typescript
  public processInputKeyPress(
    inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>,
    currentValue: string,
    setCurrentValue: (value: string) => void,
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void
  ```

---

*Convention analysis: 2025-03-27*
