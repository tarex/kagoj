# Technology Stack

**Analysis Date:** 2025-03-27

## Languages

**Primary:**
- TypeScript 5.9.3 - Full application codebase (`/src`)
- JavaScript - Configuration files (ESLint, Next.js, Tailwind)

**Secondary:**
- CSS - Styling via Tailwind CSS (`/src/app/globals.css`)

## Runtime

**Environment:**
- Node.js v24.7.0 (system requirement)

**Package Manager:**
- pnpm (with lock file `pnpm-lock.yaml`)
- Lockfile: Present

## Frameworks

**Core:**
- Next.js 16.2.1 - Full-stack React framework with App Router
  - Uses Turbopack for fast development builds (`pnpm dev --turbopack`)
  - API routes at `/src/app/api/`

**UI:**
- React 19.2.4 - Component framework
- React DOM 19.2.4 - DOM rendering

**Styling:**
- Tailwind CSS 4.2.2 - Utility-first CSS framework
- Tailwind CSS PostCSS 4.2.2 - PostCSS plugin integration
- PostCSS 8.5.8 - CSS transformation

**Type Safety:**
- TypeScript 5.9.3 - Strict type checking (target: ES2017)

## Key Dependencies

**Critical:**
- ai 6.0.140 - Vercel AI SDK for LLM integrations
- @ai-sdk/openai 3.0.48 - OpenAI model provider for AI SDK

**Utilities:**
- lodash.throttle 4.1.1 - Throttle function execution
- lodash.debounce 4.0.8 - Debounce function execution
- @types/lodash.debounce 4.0.9 - Type definitions for debounce
- @types/lodash.throttle 4.1.9 - Type definitions for throttle

**Validation:**
- zod 4.3.6 - TypeScript-first schema validation

## Dev Dependencies

**Linting & Type Checking:**
- ESLint 9.39.4 - JavaScript/TypeScript linter
- @eslint/eslintrc 3.3.5 - ESLint configuration compatibility
- eslint-config-next 16.2.1 - Next.js ESLint configuration

**Type Definitions:**
- @types/node 25.5.0 - Node.js type definitions
- @types/react 19.2.14 - React component type definitions
- @types/react-dom 19.2.3 - React DOM type definitions

**Testing:**
- puppeteer 24.40.0 - Browser automation (used in manual test scripts)

## Configuration

**Environment:**
- Configured via `.env.local` file (present)
- Key variable: `OPENAI_API_KEY` - OpenAI API authentication
- Optional: `NEXT_PUBLIC_DISABLE_SPELL_CHECK` - Toggle spell checking feature

**Build:**
- TypeScript configuration: `tsconfig.json`
  - Strict mode enabled
  - JSX: react-jsx (automatic runtime)
  - Path alias: `@/*` maps to `./src/*`
- Next.js configuration: `next.config.ts` (minimal, using defaults)
- Tailwind configuration: `tailwind.config.ts`
  - Dark mode: CSS class strategy
  - Content paths: `./src/**/*.{ts,tsx,mdx}`
- PostCSS configuration: `postcss.config.mjs`
- ESLint configuration: `eslint.config.mjs`
  - Extends: `next/core-web-vitals`, `next/typescript`

## Platform Requirements

**Development:**
- Node.js v24.x or compatible
- pnpm package manager
- Modern browser for testing (Chromium for Puppeteer tests)

**Production:**
- Deployment target: Node.js 18+ compatible platform
- Next.js standalone builds supported
- Environment variable: `OPENAI_API_KEY` required for spell-check feature

## Build Commands

```bash
pnpm dev          # Start development server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint checks
```

---

*Stack analysis: 2025-03-27*
