# Repository Guidelines

## Project Structure & Module Organization
- `src/app/`: Next.js App Router (layouts, pages, API). Example: `src/app/api/suggestions/route.ts`.
- `src/components/`: UI and feature components. Notable: `src/components/note/`.
- `src/hooks/`: Reusable React hooks (e.g., `useSpellCheck.ts`, `useDebounce.ts`).
- `src/lib/`: Core logic (Bangla input, dictionary, spell-check).
- `public/`: Static assets. `screenshots/`: test artifacts.
- Root test scripts: `test-*.js` (Puppeteer-based).

## Build, Test, and Development Commands
- `npm run dev`: Start local dev server at `http://localhost:3000` (Turbopack).
- `npm run build`: Production build.
- `npm start`: Run the production server (after build).
- `npm run lint`: Lint TypeScript/React using Next + ESLint.
- Run E2E scripts (requires server running): `node test-bangla-notebook.js` (see `screenshots/` output).

## Coding Style & Naming Conventions
- Language: TypeScript, React function components, App Router.
- Indentation: 2 spaces; prefer explicit types with `strict` TS.
- Filenames: kebab-case (e.g., `note-editor.tsx`), hooks prefixed `use*`.
- Components: PascalCase exports; colocate with feature when practical.
- Imports: use path alias `@/*` (e.g., `@/lib/bangla-input-handler`).
- Linting: ESLint flat config (`next/core-web-vitals`, TypeScript). Fix warnings before PR.

## Testing Guidelines
- Framework: Ad-hoc Puppeteer scripts in repo root (`test-*.js`).
- Prereq: Start app locally, then run tests via Node.
- Artifacts: Screenshots saved to `screenshots/`. Add new tests for UI flows you change.
- Example: `npm run dev` in one terminal; in another: `node test-professional-ui.js`.

## Commit & Pull Request Guidelines
- Commits: Short, imperative present tense (e.g., "fix spell overlay bounds"). Group related changes.
- PRs: Clear description, rationale, and testing steps. Include relevant screenshots from `screenshots/` and link issues.
- CI readiness: Ensure `npm run lint` passes and app boots locally.

## Security & Configuration Tips
- Secrets: Use `.env.local`; never commit. Likely keys: `OPENAI_API_KEY`.
- Feature toggles: `NEXT_PUBLIC_DISABLE_SPELL_CHECK=true` to bypass AI spell-check during local dev.
- Review API changes under `src/app/api/suggestions/route.ts` for safe error handling and limited payloads.

