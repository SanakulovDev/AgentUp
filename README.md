<p align="center">
  <img src="assets/agentup-hero.png" alt="AgentUp — AI Agenting, Local Setup" width="800">
</p>

# AgentUp

CLI that generates project context files for AI coding agents (Claude Code, Cursor, Codex, Gemini). One setup — no more copying the same instructions to every project.

**Generates:** `AGENTS.md`, `CLAUDE.md`, `.claude/*`, `.cursor/*`, `.agentup.json`

---

## Install

```bash
npm install -g agentup
```

Or run without installing:

```bash
npx agentup@latest init
```

---

## Usage

```bash
cd your-project
agentup init
```

Answer the prompts (language, framework, IDE, Docker, database, roles). AgentUp creates the matching config files.


## License

MIT
