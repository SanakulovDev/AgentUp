<p align="center">
  <img src="assets/agentup-hero.png" alt="AgentUp — AI Agenting, Local Setup" width="800">
</p>

# AgentUp

`agentup-cli` is a CLI that scaffolds AI agent context files for your project.
The goal is to avoid rewriting the same setup instructions in every repository.

## What It Generates
Based on selected providers, AgentUp creates:
- `AGENTS.md`
- `CLAUDE.md` and `.claude/*` (when Claude is selected)
- `.cursor/*` (when Cursor is selected)
- `.agentup.json` (generator manifest)

## Quick Start
### 1) Install Globally
```bash
npm install -g agentup-cli
agentup-cli init
```

### 2) Run Without Installing
```bash
npx agentup-cli@latest init
```

## Usage
```bash
cd your-project
agentup-cli init
```

The CLI prompts you for:
- providers (Claude/Codex/Cursor/Gemini/Antigravity)
- IDE
- auto-detect or manual mode
- content mode (`ai` or `template`)
- roles (`plan`, `review`, `test`, `code`)
- overwrite mode (`ask`, `skip`, or `replace`)
- project stack details (language, framework, database, commands)

If you choose `ask`, the CLI requests permission before changing each existing file.

For AI mode, store Gemini credentials in `.env`:
```bash
cp .env.example .env
# then edit .env and set your real key
```
`agentup-cli` automatically loads `.env` and `.env.local` from the current project folder.

## Core Commands
```bash
agentup-cli init        # Interactive scaffolding
agentup-cli __selftest  # Built-in self-tests
agentup-cli --version   # Print installed CLI version
agentup-cli --help      # Help
```

## Version Check
```bash
agentup-cli --version
npm view agentup-cli@latest version
```

## Uninstall
```bash
npm uninstall -g agentup-cli
hash -r
```

If `agentup-cli` is still found in your shell after uninstall, check:
```bash
which -a agentup-cli
```

## Automated npm Release (GitHub Actions)
This repository includes a workflow at `.github/workflows/publish.yml`.
Single source of truth for release version is `package.json -> version`.

It publishes to npm automatically when you push a version tag like:
```bash
VERSION=$(npm run -s version:show)
git tag "v$VERSION"
git push origin "v$VERSION"
```

Before publishing, the workflow:
- installs dependencies (`npm ci`)
- builds the project (`npm run build`)
- verifies `tag version == package.json version`

Required setup in GitHub:
- add repository secret `NPM_TOKEN` (npm automation token)

Version bump shortcuts:
```bash
npm run release:patch
npm run release:minor
npm run release:major
```

## Example Output Structure
```text
your-project/
├── AGENTS.md
├── .agentup.json
├── CLAUDE.md          # only if Claude is selected
├── .claude/           # only if Claude is selected
└── .cursor/           # only if Cursor is selected
```

## License
MIT
