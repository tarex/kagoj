# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bangla AI Notebook - A Next.js web application for writing Bangla text with AI-powered suggestions and advanced phonetic typing capabilities.

## Development Commands

```bash
# Install dependencies (use pnpm, not npm)
pnpm install

# Run development server with Turbopack
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

## Architecture Overview

### Core Components

- **BanglaInputHandler** (`/src/lib/bangla-input-handler.ts`): Singleton class managing phonetic input conversion with 100+ transliteration patterns
- **NoteComponent** (`/src/components/note/`): Main note-taking interface with language toggle and font controls
- **AI Suggestions API** (`/src/app/api/suggestions/route.ts`): OpenAI GPT-4-turbo integration for context-aware text suggestions

### Key Design Patterns

- Singleton pattern for input handler to maintain consistent state
- Custom React hooks for state management (`useNotes`)
- Context-based phonetic processing with extensive pattern matching
- Throttled input handling for performance optimization

### Directory Structure

- `/src/app/`: Next.js App Router pages and API routes
- `/src/components/note/`: Note-taking UI components
- `/src/lib/`: Core libraries for Bangla input processing
  - `context-pattern.ts`: Contains 100+ transliteration rules
  - `bangla-input-handler.ts`: Main input processing logic

## Important Implementation Details

- do not build after the change.

### Bangla Input Processing

- Uses Avro-style phonetic conversion
- Context-aware pattern matching for accurate transliteration
- Language toggle: Ctrl+B (or ⌘+B on Mac)
- Supports complex conjuncts and special characters

### AI Integration

- OpenAI API key required in environment variables
- Suggestions API at `/api/suggestions` returns creative writing completions
- Context-aware suggestions based on preceding text

## Code Standards (from .cursorrules)

- Use TypeScript with strict type declarations (avoid `any`)
- Follow SOLID principles for classes
- Keep functions under 20 instructions
- Use JSDoc for public methods
- PascalCase for classes, camelCase for variables/functions
- Prefer clean code and design patterns

## Environment Variables

Required for AI features:

- `OPENAI_API_KEY`: OpenAI API key for text suggestions

## Testing

No formal testing framework currently implemented. When adding tests, consider the complex phonetic conversion logic in `bangla-input-handler.ts` as a priority for unit testing.

- do not run `pnpm build` after the code changes