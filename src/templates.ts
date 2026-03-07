import type { AgentRole, InitAnswers, TemplateContext } from './types.js';

export function buildTemplateContext(answers: InitAnswers): TemplateContext {
  return {
    name: answers.projectInfo.name,
    description: answers.projectInfo.description,
    language: answers.projectInfo.language,
    languageVersion: answers.projectInfo.languageVersion,
    framework: answers.projectInfo.framework,
    dockerEnabled: answers.projectInfo.dockerEnabled,
    database: answers.projectInfo.database,
    databaseVersion: answers.projectInfo.databaseVersion,
    stack: answers.projectInfo.stack,
    packageManager: answers.projectInfo.packageManager ?? 'npm',
    ide: answers.ide,
    providers: answers.providers,
    roles: answers.roles,
    commands: {
      dev: answers.projectInfo.devCommand,
      build: answers.projectInfo.buildCommand,
      test: answers.projectInfo.testCommand,
      lint: answers.projectInfo.lintCommand,
    },
  };
}

export function renderAgentUpManifest(answers: InitAnswers): Record<string, unknown> {
  return {
    $schema: 'https://agentup.dev/schema/agentup.json',
    generatedAt: new Date().toISOString(),
    providers: answers.providers,
    ide: answers.ide,
    roles: answers.roles,
    project: {
      ...answers.projectInfo,
      deploy: {
        docker: answers.projectInfo.dockerEnabled ?? false,
      },
      database: {
        engine: answers.projectInfo.database ?? 'none',
        version: answers.projectInfo.database === 'none' ? '' : answers.projectInfo.databaseVersion ?? '',
      },
    },
  };
}

export function renderAgentsMd(ctx: TemplateContext): string {
  const dbText =
    ctx.database && ctx.database !== 'none'
      ? `${ctx.database} ${ctx.databaseVersion ?? ''}`.trim()
      : 'none';

  return `# AGENTS.md

## Project
- Name: ${ctx.name}
- Description: ${ctx.description}
- Language: ${ctx.language ?? 'unknown'}
- Language version: ${ctx.languageVersion ?? 'not specified'}
- Framework: ${ctx.framework ?? 'not specified'}
- Deploy with Docker: ${ctx.dockerEnabled ? 'yes' : 'no'}
- Database: ${dbText}
- Stack: ${ctx.stack.join(', ') || 'Unknown stack'}
- Primary IDE: ${ctx.ide}
- Enabled providers: ${ctx.providers.join(', ')}

## Working agreement
- Before making non-trivial changes, create a short plan.
- Prefer small, focused edits over broad rewrites.
- Do not invent APIs, commands, or file paths. Verify them first.
- Preserve existing architecture unless there is a clear reason to refactor.
- Respect language version, framework constraints, deploy mode, and database specifics.
- If changing behavior, update tests or add tests when practical.
- After code changes, run the most relevant verification commands.

## Verification commands
${renderCommandList(ctx.commands)}

## Output style
- Be direct.
- Surface assumptions early.
- Call out risks, migrations, and breaking changes explicitly.
- When a task is ambiguous, prefer the smallest safe implementation.

## Roles enabled
${ctx.roles.map((role) => `- ${role}`).join('\n')}
`;
}

export function renderClaudeRoot(): string {
  return `# CLAUDE.md

@AGENTS.md

## Claude-specific notes
- Use the nearest .claude/rules guidance when working in scoped areas.
- Prefer skills for repeatable workflows and commands for explicit invocation.
- Keep answers concise, but not vague.
- Always mention what you verified and what you did not verify.
`;
}

export function renderClaudeSettings(answers: InitAnswers): Record<string, unknown> {
  return {
    allowedTools: ['Read', 'Edit', 'Write', 'Glob', 'Grep', 'LS', 'Bash'],
    model: 'claude-sonnet-4-5',
    dangerousMode: false,
    project: {
      ide: answers.ide,
      providers: answers.providers,
      roles: answers.roles,
    },
  };
}

export function renderClaudeSettingsLocalExample(): Record<string, unknown> {
  return {
    allowedTools: ['Read', 'Edit', 'Write', 'Glob', 'Grep', 'LS', 'Bash'],
    dangerousMode: true,
    note: 'Rename to settings.local.json for local-only overrides. Keep it out of git.',
  };
}

export function renderClaudeMcp(): Record<string, unknown> {
  return {
    mcpServers: {},
  };
}

export function renderClaudeProjectRule(ctx: TemplateContext): string {
  const dbText =
    ctx.database && ctx.database !== 'none'
      ? `${ctx.database} ${ctx.databaseVersion ?? ''}`.trim()
      : 'none';

  return `---
files: ["**/*"]
---

# Project Core
- Project: ${ctx.name}
- Description: ${ctx.description}
- Language: ${ctx.language ?? 'unknown'} ${ctx.languageVersion ?? ''}
- Framework: ${ctx.framework ?? 'not specified'}
- Docker: ${ctx.dockerEnabled ? 'yes' : 'no'}
- Database: ${dbText}
- Primary IDE: ${ctx.ide}

## Core rules
- Read nearby files before changing patterns.
- Match existing architecture before introducing new abstractions.
- Explain tradeoffs when changing structure.
- Avoid speculative refactors.
`;
}

export function renderClaudeVerificationRule(ctx: TemplateContext): string {
  return `---
files: ["**/*"]
---

# Verification
- After implementation, run the smallest relevant verification commands.
- Prefer targeted checks first, then broader checks if needed.
- If a command cannot run, say exactly why.

## Commands
${renderCommandList(ctx.commands)}
`;
}

export function renderClaudeOutputRule(): string {
  return `---
files: ["**/*"]
---

# Output style
- Do not ramble.
- Mention changed files explicitly.
- Mention risks and follow-up tasks explicitly.
- No fake certainty. If not verified, say it is unverified.
`;
}

export function renderClaudeCommand(role: AgentRole, ctx: TemplateContext): string {
  const roleText: Record<AgentRole, string> = {
    plan: 'Create a short implementation plan for the current task. Include affected files, risks, and verification steps.',
    review: 'Review the current diff or relevant files. Prioritize correctness, maintainability, and risk hotspots.',
    test: `Run or propose the best test strategy for this task. Prefer: ${ctx.commands.test ?? 'project test command not configured'}.`,
    code: 'Implement the requested change with minimal, focused edits. Verify after changes.',
  };

  return `---
description: ${role} workflow
allowed-tools: Read,Edit,Write,Glob,Grep,LS,Bash
---

${roleText[role]}
`;
}

export function renderClaudeSkill(role: AgentRole, ctx: TemplateContext): string {
  return `---
name: ${role}-workflow
description: ${role} workflow for ${ctx.name}
---

# ${capitalize(role)} Workflow

## Project context
- Language: ${ctx.language ?? 'unknown'} ${ctx.languageVersion ?? ''}
- Framework: ${ctx.framework ?? 'not specified'}
- Docker: ${ctx.dockerEnabled ? 'yes' : 'no'}
- Database: ${
    ctx.database && ctx.database !== 'none'
      ? `${ctx.database} ${ctx.databaseVersion ?? ''}`.trim()
      : 'none'
  }

## Steps
1. Understand the task and inspect nearby files.
2. Identify the smallest safe change.
3. Execute the ${role} workflow.
4. Verify the result.
5. Report what changed and any remaining risks.
`;
}

export function renderClaudeAgent(role: AgentRole, ctx: TemplateContext): string {
  return `---
description: ${capitalize(role)} specialist for ${ctx.name}
---

# ${capitalize(role)} Agent

## Mission
Be the ${role} specialist for ${ctx.name}.

## Constraints
- Respect language: ${ctx.language ?? 'unknown'} ${ctx.languageVersion ?? ''}
- Respect framework: ${ctx.framework ?? 'not specified'}
- Respect deploy mode: ${ctx.dockerEnabled ? 'docker' : 'non-docker'}
- Respect database specifics
`;
}

export function renderClaudeHooksReadme(ctx: TemplateContext): string {
  return `# Claude hooks

Suggested commands:
- Lint: ${ctx.commands.lint ?? 'not configured'}
- Test: ${ctx.commands.test ?? 'not configured'}
`;
}

export function renderCursorReadme(ctx: TemplateContext): string {
  return `# .cursor

This directory configures Cursor for ${ctx.name}.

## Notes
- Language: ${ctx.language ?? 'unknown'} ${ctx.languageVersion ?? ''}
- Framework: ${ctx.framework ?? 'not specified'}
- Docker: ${ctx.dockerEnabled ? 'yes' : 'no'}
- Database: ${
    ctx.database && ctx.database !== 'none'
      ? `${ctx.database} ${ctx.databaseVersion ?? ''}`.trim()
      : 'none'
  }
`;
}

export function renderCursorMcp(): Record<string, unknown> {
  return {
    mcpServers: {},
  };
}

export function renderCursorRule(
  kind: 'project-core' | 'verification' | 'output-style',
  ctx: TemplateContext,
): string {
  if (kind === 'project-core') {
    return `---
description: Core repository guidance for ${ctx.name}
globs: ["**/*"]
alwaysApply: true
---

# ${ctx.name} core rule
- Description: ${ctx.description}
- Language: ${ctx.language ?? 'unknown'} ${ctx.languageVersion ?? ''}
- Framework: ${ctx.framework ?? 'not specified'}
- Docker: ${ctx.dockerEnabled ? 'yes' : 'no'}
- Database: ${
      ctx.database && ctx.database !== 'none'
        ? `${ctx.database} ${ctx.databaseVersion ?? ''}`.trim()
        : 'none'
    }
- IDE: ${ctx.ide}

## Rules
- Inspect surrounding files before editing.
- Preserve current architecture unless the task requires change.
- Prefer minimal, reversible edits.
- Reuse existing utilities before adding new helpers.
`;
  }

  if (kind === 'verification') {
    return `---
description: Verification and check execution
globs: ["**/*"]
alwaysApply: true
---

## Preferred commands
${renderCommandList(ctx.commands)}
`;
  }

  return `---
description: Output style for agent responses
globs: ["**/*"]
alwaysApply: true
---

# Output style
- Be direct and specific.
- Mention changed files and why they changed.
- Mention risks, migrations, and follow-up work.
- Avoid fluffy filler.
`;
}

export function renderCursorCommand(role: AgentRole, ctx: TemplateContext): string {
  return `# /${role}

## Objective
${renderRoleObjective(role, ctx)}
`;
}

export function renderCursorSkill(role: AgentRole, ctx: TemplateContext): string {
  return `# ${capitalize(role)} Workflow Skill

## Goal
${renderRoleObjective(role, ctx)}
`;
}

export function renderCursorAgent(role: AgentRole, ctx: TemplateContext): string {
  return `# ${capitalize(role)} Agent

You specialize in **${role}** tasks for **${ctx.name}**.

## Constraints
- Language: ${ctx.language ?? 'unknown'} ${ctx.languageVersion ?? ''}
- Framework: ${ctx.framework ?? 'not specified'}
- Docker: ${ctx.dockerEnabled ? 'yes' : 'no'}
`;
}

export function renderCursorArchitectureDoc(ctx: TemplateContext): string {
  return `# Architecture notes

- Name: ${ctx.name}
- Description: ${ctx.description}
- Language: ${ctx.language ?? 'unknown'} ${ctx.languageVersion ?? ''}
- Framework: ${ctx.framework ?? 'not specified'}
- Stack: ${ctx.stack.join(', ') || 'Unknown'}
`;
}

export function renderCursorHooksReadme(ctx: TemplateContext): string {
  return `# Cursor hooks

- Lint: ${ctx.commands.lint ?? 'not configured'}
- Test: ${ctx.commands.test ?? 'not configured'}
`;
}

export function renderRoleObjective(role: AgentRole, ctx: TemplateContext): string {
  switch (role) {
    case 'plan':
      return `Break work into safe implementation steps for ${ctx.name}.`;
    case 'review':
      return 'Review code changes for correctness, maintainability, and risk.';
    case 'test':
      return `Design or execute the best validation path using ${ctx.commands.test ?? 'the project test flow'}.`;
    case 'code':
      return 'Implement the requested change with minimal, focused edits.';
    default:
      return 'Handle the requested workflow.';
  }
}

export function renderCommandList(commands: TemplateContext['commands']): string {
  const entries: string[] = [];
  if (commands.dev) entries.push(`- Dev: \`${commands.dev}\``);
  if (commands.build) entries.push(`- Build: \`${commands.build}\``);
  if (commands.test) entries.push(`- Test: \`${commands.test}\``);
  if (commands.lint) entries.push(`- Lint: \`${commands.lint}\``);
  return entries.length > 0 ? entries.join('\n') : '- No commands configured yet';
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
