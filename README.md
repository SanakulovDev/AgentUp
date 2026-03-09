<p align="center">
  <img src="assets/agentup-hero.png" alt="AgentUp CLI - AI agent setup generator for AGENTS.md, Claude Code, and Cursor" width="900">
</p>

<h1 align="center">AgentUp CLI</h1>

<p align="center">
  AI agent context generator for <strong>AGENTS.md</strong>, <strong>Claude Code</strong>, <strong>Cursor</strong>, <strong>Codex</strong>, and <strong>Gemini</strong> workflows.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/agentup-cli"><img src="https://img.shields.io/npm/v/agentup-cli?label=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/agentup-cli"><img src="https://img.shields.io/npm/dm/agentup-cli" alt="npm downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="MIT license"></a>
</p>

`agentup-cli` helps teams bootstrap consistent AI coding-agent instructions in any repository.
Instead of manually writing agent rules every time, run one command and generate production-ready context files.

## GitHub About SEO (Recommended)
Suggested repository description:
```text
CLI to generate AGENTS.md and AI coding agent scaffolding for Claude Code, Cursor, Codex, and Gemini.
```

Suggested GitHub topics:
```text
agentup, agentup-cli, agents-md, ai-agent, ai-coding-agent, cli, claude-code, cursor, codex, gemini, prompt-engineering, context-engineering
```

## Why AgentUp
- Generate `AGENTS.md` automatically for AI coding assistants.
- Scaffold provider-specific configs for Claude Code and Cursor.
- Keep agent roles consistent (`plan`, `review`, `test`, `code`) across repos.
- Detect project stack (language, framework, database, package manager) to produce relevant defaults.
- Reduce onboarding time for new contributors and AI-assisted workflows.

## What AgentUp Generates
Always generated:
- `AGENTS.md`
- `.agentup.json`

Generated when `Claude Code` is selected:
- `CLAUDE.md`
- `.claude/settings.json`
- `.claude/rules/*`
- `.claude/commands/*`
- `.claude/skills/*`
- `.claude/agents/*`

Generated when `Cursor` is selected:
- `.cursor/README.md`
- `.cursor/rules/*`
- `.cursor/commands/*`
- `.cursor/skills/*`
- `.cursor/agents/*`
- `.cursor/docs/architecture.md`

## Install
Global install:
```bash
npm install -g agentup-cli
```

Run without global install:
```bash
npx agentup-cli@latest init
```

## Quick Start
```bash
cd your-project
agentup-cli init
```

The interactive CLI asks for:
- provider targets: `Claude`, `Codex`, `Cursor`, `Gemini`, `Antigravity`
- primary IDE
- context source: auto-detect or manual
- content mode: `ai` or `template`
- roles: `plan`, `review`, `test`, `code`
- overwrite mode: `ask`, `skip`, `replace`

If overwrite mode is `ask`, AgentUp asks before changing each existing file.

## AI Mode (Gemini)
`ai` mode uses Gemini review to improve generated context.

```bash
cp .env.example .env
# set GEMINI_API_KEY in .env
```

`agentup-cli` automatically loads `.env` and `.env.local` from the selected project root.
If `GEMINI_API_KEY` is missing, it safely falls back to template mode.

## CLI Commands
```bash
agentup-cli init        # Interactive scaffolding
agentup-cli __selftest  # Built-in self-tests
agentup-cli --version   # Show installed version
agentup-cli --help      # Show command help
```

Check latest npm version:
```bash
agentup-cli --version
npm view agentup-cli@latest version
```

## Example Output
```text
your-project/
├── AGENTS.md
├── .agentup.json
├── CLAUDE.md                # if Claude selected
├── .claude/                 # if Claude selected
└── .cursor/                 # if Cursor selected
```

## Local Development
```bash
npm install
npm run dev -- init
npm run build
npm run selftest
node dist/index.js init
```

## Automated npm Release
GitHub Actions workflow: `.github/workflows/publish.yml`

Release by pushing a version tag:
```bash
VERSION=$(npm run -s version:show)
git tag "v$VERSION"
git push origin "v$VERSION"
```

Workflow checks:
- `npm ci`
- `npm run build`
- tag version matches `package.json` version

Required GitHub secret:
- `NPM_TOKEN`

Version bump helpers:
```bash
npm run release:patch
npm run release:minor
npm run release:major
```

## FAQ
### What is AgentUp CLI?
AgentUp is an AI agent setup CLI that generates repository instructions and provider-specific scaffolding for coding assistants.

### Can I use AgentUp for Codex, Claude Code, and Cursor?
Yes. AgentUp supports multi-provider generation in one run.

### Does AgentUp work in existing repositories?
Yes. Use overwrite mode `ask` or `skip` to safely adopt it in active projects.

## License
MIT
