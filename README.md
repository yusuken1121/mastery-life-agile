# Next.js Clean Architecture Boilerplate (AI-Native)

A Next.js App Router boilerplate for AI-assisted development (Cursor, etc.).

**Request flow:**

```
UI → React Query → /api/* → Use Case → Infrastructure
```

Detailed rules live in **Skills** — not in this file. Read the relevant skill before coding.

## Skills (Source of Truth)

All architecture rules, patterns, and workflows are defined in [`.cursor/skills/`](.cursor/skills/).

| Skill                                                                                | Use when…                                                 |
| :----------------------------------------------------------------------------------- | :-------------------------------------------------------- |
| [architecture-overview](.cursor/skills/architecture-overview/SKILL.md)               | Understanding layers, data flow, or directory layout      |
| [architectural-rules](.cursor/skills/architectural-rules/SKILL.md)                   | Writing or reviewing code — import boundaries & standards |
| [project-setup](.cursor/skills/project-setup/SKILL.md)                               | Installing, configuring env vars, running dev/test        |
| [react-query-api-pattern](.cursor/skills/react-query-api-pattern/SKILL.md)           | Wiring UI → API Route → Use Case                          |
| [clean-architecture-extension](.cursor/skills/clean-architecture-extension/SKILL.md) | Adding a new feature or AI provider end-to-end            |
| [notion-integration](.cursor/skills/notion-integration/SKILL.md)                     | Connecting forms or records to Notion databases           |
| [sidebar-management](.cursor/skills/sidebar-management/SKILL.md)                     | Adding a route to the sidebar menu                        |

### For AI agents

Before generating code, read:

1. [architectural-rules](.cursor/skills/architectural-rules/SKILL.md)
2. [architecture-overview](.cursor/skills/architecture-overview/SKILL.md)
3. The skill matching your task (from the table above)

Cursor always-applied rules: [`.cursor/rules/code-rules.mdc`](.cursor/rules/code-rules.mdc)

## Learning Guide

Beginner-friendly walkthrough (Japanese): [docs/beginner-architecture-guide.md](docs/beginner-architecture-guide.md)

## Quick Start

```bash
pnpm install
cp .env.example .env.local   # fill in GEMINI_API_KEY, etc.
pnpm dev
```

Full setup details → [project-setup skill](.cursor/skills/project-setup/SKILL.md)

## Format & Lint

```bash
pnpm format        # Prettier — auto-fix formatting
pnpm format:check  # Prettier — check only (CI)
pnpm lint          # ESLint
pnpm lint:fix      # ESLint — auto-fix
pnpm check         # format:check + lint + test
```

## Tech Stack

Next.js 15 · TypeScript · React Query · Gemini · Notion · shadcn/ui · Tailwind v4 · Vitest · pnpm

Details → [project-setup skill](.cursor/skills/project-setup/SKILL.md)

## Adding a Feature (Checklist)

1. Entity → Port → Use Case → Infrastructure
2. Route Handler (`src/app/api/`) with Zod + DI
3. API wrapper + React Query hook (`src/lib/api/`)
4. UI component (`src/app/_components/`)

Full guide → [clean-architecture-extension skill](.cursor/skills/clean-architecture-extension/SKILL.md)
