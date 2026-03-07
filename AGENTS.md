# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains TypeScript sources.
- `src/index.ts` is the CLI entrypoint and prompt flow.
- `src/project.ts` detects project details and package-manager command behavior.
- `src/templates.ts` renders generated context files (`AGENTS.md`, `CLAUDE.md`, etc.).
- `src/generator.ts` writes files to disk.
- `src/selftest.ts` holds lightweight assertions.
- `dist/` is compiled JavaScript used by the published CLI binary.
- `assets/` stores documentation assets (for example, `assets/agentup-hero.png`).

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev -- init`: run the CLI directly from TypeScript via `tsx`.
- `npm run build`: compile `src/**/*.ts` into `dist/` with `tsc`.
- `npm run selftest`: execute the built-in self-test suite (`__selftest` command path).
- `node dist/index.js init`: smoke-test the compiled CLI output.

## Coding Style & Naming Conventions
- Use TypeScript with ESM (`"type": "module"`) and strict typing (`"strict": true`).
- Follow existing style: 2-space indentation, semicolons, and single quotes.
- Use `camelCase` for variables/functions and `PascalCase` for types/interfaces.
- Keep modules focused: orchestration in `index.ts`, rendering in `templates.ts`, file generation in `generator.ts`.
- No dedicated lint/formatter is configured; use `npm run build` to catch type and compile issues.

## Testing Guidelines
- Add and maintain deterministic checks in `src/selftest.ts`.
- Prefer pure/unit-style assertions; avoid external network dependencies in tests.
- Run `npm run selftest` and `npm run build` before opening a pull request.
- If template behavior changes, include a sample generated snippet or diff in the PR.

## Commit & Pull Request Guidelines
- Match existing commit style: short, imperative, sentence-case subjects (example: `Update README with install and usage examples`).
- Keep each commit focused on a single concern.
- PRs should include what changed, why it changed, and validation steps run.
- Link related issues/tasks and include terminal output or screenshots when CLI UX changes.
