<p align="center">
  <img src="assets/agentup-hero.png" alt="AgentUp CLI - AI agent setup generator for AGENTS.md, Claude Code, and Cursor" width="900">
</p>

<h1 align="center">AgentUp CLI</h1>

<p align="center">
  Generate <strong>AGENTS.md</strong> and AI coding-agent scaffolding for <strong>Claude Code</strong>, <strong>Cursor</strong>, <strong>Codex</strong>, and <strong>Gemini</strong>.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/agentup-cli"><img src="https://img.shields.io/npm/v/agentup-cli?label=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/agentup-cli"><img src="https://img.shields.io/npm/dm/agentup-cli" alt="npm downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="MIT license"></a>
</p>

`agentup-cli` is an interactive CLI for setting up AI agent instructions inside a repository.
It helps you avoid rewriting the same context files in every project.

If you searched for `agentup`, `AgentUp`, `agent up`, `agentupcli`, or `agentup-cli`, this is the official project.

## What You Get
- Fast setup for AI coding agents in existing or new repositories.
- Consistent `AGENTS.md` and provider-specific scaffolding.
- Auto-detected project context (language, framework, database, package manager).
- Reusable role workflows: `plan`, `review`, `test`, `code`.

## Install
Global:
```bash
npm install -g agentup-cli
```

Without global install:
```bash
npx agentup-cli@latest init
```

## Quick Start (2 Minutes)
```bash
cd your-project
agentup-cli init
```

The CLI asks you to choose:
- providers: `Claude`, `Codex`, `Cursor`, `Gemini`, `Antigravity`
- IDE
- context source: auto-detect or manual
- content mode: `ai` or `template`
- roles: `plan`, `review`, `test`, `code`
- overwrite behavior: `ask`, `skip`, `replace`

If overwrite mode is `ask`, AgentUp prompts before changing existing files.

## Generated Files
Always:
- `AGENTS.md`
- `.agentup.json`

When `Claude` is selected:
- `CLAUDE.md`
- `.claude/settings.json`
- `.claude/rules/*`
- `.claude/commands/*`
- `.claude/skills/*`
- `.claude/agents/*`

When `Cursor` is selected:
- `.cursor/README.md`
- `.cursor/rules/*`
- `.cursor/commands/*`
- `.cursor/skills/*`
- `.cursor/agents/*`
- `.cursor/docs/architecture.md`

## AI Mode vs Template Mode
`template` mode works fully offline and uses built-in templates.
`ai` mode uses Gemini-based review to improve generated context.

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

## Example Output
```text
your-project/
├── AGENTS.md
├── .agentup.json
├── CLAUDE.md                # if Claude selected
├── .claude/                 # if Claude selected
└── .cursor/                 # if Cursor selected
```

## Local Development (Project Maintainers)
```bash
npm install
npm run dev -- init
npm run build
npm run selftest
node dist/index.js init
```

## Release Flow
Workflow: `.github/workflows/publish.yml`

Publish by pushing a version tag:
```bash
VERSION=$(npm run -s version:show)
git tag "v$VERSION"
git push origin "v$VERSION"
```

The workflow runs:
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
AgentUp is a CLI that generates AI coding-agent context files for your repository.

### Can I use AgentUp for Codex, Claude Code, and Cursor?
Yes. One run can scaffold multiple providers.

### Does AgentUp work in existing repositories?
Yes. Use overwrite mode `ask` or `skip` to safely adopt it in active projects.

### Is AgentUp the same as "agent up" or "agentupcli"?
Yes. `AgentUp`, `agent up`, `agentupcli`, and `agentup-cli` refer to this same CLI project.

## License
MIT
