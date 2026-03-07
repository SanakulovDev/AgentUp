#!/usr/bin/env node

import fs from 'fs';
import process from 'process';
import path from 'path';
import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  multiselect,
  outro,
  select,
  spinner,
  text,
} from '@clack/prompts';
import pc from 'picocolors';

import type {
  AgentRole,
  ContentMode,
  Database,
  DetectionMode,
  IDE,
  InitAnswers,
  Language,
  OverwriteMode,
  ProjectInfo,
  Provider,
} from './types.js';

import {
  ALL_DATABASES,
  ALL_LANGUAGES,
  DATABASE_VERSION_PLACEHOLDERS,
  FRAMEWORKS_BY_LANGUAGE,
  LANGUAGE_VERSION_PLACEHOLDERS,
} from './types.js';

import { getArgv, getCwd, loadEnvFromCwd } from './runtime.js';
import { planAgentUpFiles, writeAgentUpFiles, type PlannedFile } from './generator.js';
import { generateAiOverrides } from './ai.js';
import { detectProjectInfo, emptyProjectInfo } from './project.js';
import { normalizeOptional, splitCsv } from './utils.js';

loadEnvFromCwd();

const argv = getArgv();
const command = argv[0];
const SIGINT_EXIT_CODE = 130;

process.on('SIGINT', () => {
  cancel('Ctrl + C pressed. Quit.');
  process.exit(SIGINT_EXIT_CODE);
});

void main();

async function main(): Promise<void> {
  if (command === '__selftest') {
    const { runSelfTests } = await import('./selftest.js');
    runSelfTests();
    return;
  }

  if (command && ['-v', '--version', 'version'].includes(command)) {
    printVersion();
    return;
  }

  if (!command || ['-h', '--help', 'help'].includes(command)) {
    printHelp();
    return;
  }

  if (command !== 'init') {
    console.error(pc.red(`Unknown command: ${command}`));
    printHelp();
    process.exit(1);
  }

  intro(renderIntroBanner());

  const answers = await collectAnswers();
  const planSpinner = spinner();

  planSpinner.start('Preparing generation plan...');
  try {
    let plannedFiles = planAgentUpFiles(answers);

    if (answers.contentMode === 'ai') {
      planSpinner.stop('Base templates prepared');
      planSpinner.start('Running AI project review...');
      const aiResult = await generateAiOverrides(answers.projectRoot, plannedFiles);
      if (aiResult.warning) {
        log.warn(aiResult.warning);
      }
      if (Object.keys(aiResult.overrides).length > 0) {
        plannedFiles = planAgentUpFiles(answers, aiResult.overrides);
      }
    }

    planSpinner.stop(`Prepared ${plannedFiles.length} file(s)`);

    const forceReplacePaths = new Set<string>();
    if (answers.providers.includes('codex')) {
      forceReplacePaths.add('AGENTS.md');
    }

    const filesToWrite = await resolveWritePlan(plannedFiles, answers.overwriteMode, forceReplacePaths);
    if (filesToWrite.length === 0) {
      log.warn('No files were written (all skipped or declined).');
      printSummary(answers, []);
      outro(pc.yellow('Nothing changed.'));
      return;
    }

    const writeSpinner = spinner();
    writeSpinner.start('Writing project agent scaffolding...');
    const writtenFiles = writeAgentUpFiles(filesToWrite);
    writeSpinner.stop(`Generated ${writtenFiles.length} file(s)`);

    log.success('AgentUp initialization complete');
    printSummary(answers, writtenFiles);
    outro(pc.green('Done. Repo has agent context now.'));
  } catch (error) {
    planSpinner.stop('Generation failed');
    console.error(pc.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
AgentUp CLI

Usage:
  agentup-cli init
  agentup-cli __selftest
  agentup-cli --version
  agentup-cli --help

Tip:
  Press Ctrl + C to quit.
`);
}

function printVersion(): void {
  console.log(getCliVersion());
}

function getCliVersion(): string {
  try {
    const pkgPath = new URL('../package.json', import.meta.url);
    const pkgRaw = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(pkgRaw) as { version?: unknown };
    return typeof pkg.version === 'string' ? pkg.version : 'unknown';
  } catch {
    return 'unknown';
  }
}

function renderIntroBanner(): string {
  const lines = [
    '------------------------------------------------------------',
    '      _    ____ _____ _   _ _____ _   _ ____      ____ _     ___ ',
    '     / \\  / ___| ____| \\ | |_   _| | | |  _ \\    / ___| |   |_ _|',
    '    / _ \\| |  _|  _| |  \\| | | | | | | | |_) |  | |   | |    | | ',
    '   / ___ \\ |_| | |___| |\\  | | | | |_| |  __/   | |___| |___ | | ',
    '  /_/   \\_\\____|_____|_| \\_| |_|  \\___/|_|       \\____|_____|___|',
    '------------------------------------------------------------',
  ];
  return `${pc.cyan(lines.join('\n'))}\n${pc.dim('bootstrap AI-agent project context')}`;
}

async function collectAnswers(): Promise<InitAnswers> {
  const rootInput = await text({
    message: 'Project path',
    placeholder: getCwd(),
    defaultValue: getCwd(),
    validate(value) {
      if (!value || !String(value).trim()) return 'Project path is required';
      return undefined;
    },
  });
  if (isCancel(rootInput)) abort();

  const projectRoot = path.resolve(String(rootInput));
  loadEnvFromCwd(projectRoot);

  const providers = await multiselect({
    message: 'Choose AI providers / agent runtimes',
    options: [
      { label: 'Claude Code', value: 'claude', hint: '.claude + CLAUDE.md' },
      { label: 'Codex', value: 'codex', hint: 'AGENTS.md-first' },
      { label: 'Gemini CLI', value: 'gemini', hint: 'compatible via AGENTS.md' },
      { label: 'Cursor', value: 'cursor', hint: '.cursor + AGENTS.md' },
      { label: 'Antigravity', value: 'antigravity', hint: 'shared context scaffolding' },
    ],
    required: true,
  });
  if (isCancel(providers)) abort();

  const ide = await select({
    message: 'Primary IDE',
    options: [
      { label: 'Cursor', value: 'cursor' },
      { label: 'VS Code', value: 'vscode' },
      { label: 'PhpStorm', value: 'phpstorm' },
      { label: 'Zed', value: 'zed' },
      { label: 'JetBrains (generic)', value: 'jetbrains' },
    ],
  });
  if (isCancel(ide)) abort();

  const detectionMode = await select({
    message: 'Project context source',
    options: [
      { label: 'Auto-detect from project files', value: 'auto' },
      { label: 'Manual input', value: 'manual' },
    ],
  });
  if (isCancel(detectionMode)) abort();

  const contentModeInput = await select({
    message: 'Content generation mode',
    options: [
      {
        label: 'AI project review (recommended)',
        value: 'ai',
        hint: process.env.GEMINI_API_KEY ? 'uses GEMINI_API_KEY' : 'requires GEMINI_API_KEY',
      },
      { label: 'Template only (offline)', value: 'template' },
    ],
  });
  if (isCancel(contentModeInput)) abort();
  const contentMode =
    contentModeInput === 'ai' && !process.env.GEMINI_API_KEY ? ('template' as ContentMode) : (contentModeInput as ContentMode);
  if (contentModeInput === 'ai' && contentMode === 'template') {
    log.warn('GEMINI_API_KEY not found. Falling back to template mode.');
  }

  const roles = await multiselect({
    message: 'Select agent roles to scaffold',
    options: [
      { label: 'Plan', value: 'plan', hint: 'planning / architecture / breakdowns' },
      { label: 'Review', value: 'review', hint: 'code review / static analysis' },
      { label: 'Test', value: 'test', hint: 'test generation / validation flows' },
      { label: 'Code', value: 'code', hint: 'implementation / refactor / bugfix flow' },
    ],
    required: true,
  });
  if (isCancel(roles)) abort();

  const overwriteMode = await select({
    message: 'When a file already exists',
    options: [
      { label: 'Ask before overwrite', value: 'ask' },
      { label: 'Skip existing files', value: 'skip' },
      { label: 'Replace generated files', value: 'replace' },
    ],
  });
  if (isCancel(overwriteMode)) abort();

  const detected =
    detectionMode === 'auto'
      ? detectProjectInfo(projectRoot)
      : emptyProjectInfo(path.basename(projectRoot));

  const projectInfo = await refineProjectInfo(projectRoot, detected);
  const providerList = providers as Provider[];

  return {
    projectRoot,
    providers: providerList,
    ide: ide as IDE,
    detectionMode: detectionMode as DetectionMode,
    contentMode,
    roles: roles as AgentRole[],
    overwriteMode: overwriteMode as OverwriteMode,
    projectInfo,
    createClaudeDir: providerList.includes('claude'),
    createCursorDir: providerList.includes('cursor'),
  };
}

async function resolveWritePlan(
  plannedFiles: PlannedFile[],
  overwriteMode: OverwriteMode,
  forceReplacePaths: ReadonlySet<string> = new Set<string>(),
): Promise<PlannedFile[]> {
  const selected: PlannedFile[] = [];

  for (const file of plannedFiles) {
    const exists = fs.existsSync(file.absolutePath);
    if (!exists) {
      selected.push(file);
      continue;
    }

    const currentContent = safeReadText(file.absolutePath);
    if (currentContent === file.content) {
      continue;
    }

    if (forceReplacePaths.has(file.relativePath)) {
      selected.push(file);
      continue;
    }

    if (overwriteMode === 'skip') {
      continue;
    }

    if (overwriteMode === 'replace') {
      selected.push(file);
      continue;
    }

    const overwrite = await confirm({
      message: `${file.relativePath} already exists. Overwrite?`,
      initialValue: false,
    });
    if (isCancel(overwrite)) abort();
    if (overwrite) selected.push(file);
  }

  return selected;
}

async function refineProjectInfo(projectRoot: string, base: ProjectInfo): Promise<ProjectInfo> {
  const name = await text({
    message: 'Project name',
    defaultValue: base.name || path.basename(projectRoot),
    validate(value) {
      if (!value || !String(value).trim()) return 'Project name is required';
      return undefined;
    },
  });
  if (isCancel(name)) abort();

  const description = await text({
    message: 'Project description',
    placeholder: 'What does this project do?',
    defaultValue: base.description,
    validate(value) {
      if (!value || !String(value).trim()) return 'Description is required';
      return undefined;
    },
  });
  if (isCancel(description)) abort();

  const language = await select({
    message: 'Programming language',
    options: ALL_LANGUAGES.map((item) => ({ label: item, value: item })),
  });
  if (isCancel(language)) abort();

  const languageVersion = await text({
    message: 'Language version',
    defaultValue: base.languageVersion ?? LANGUAGE_VERSION_PLACEHOLDERS[language as Language],
    placeholder: LANGUAGE_VERSION_PLACEHOLDERS[language as Language],
  });
  if (isCancel(languageVersion)) abort();

  const frameworkOptions = FRAMEWORKS_BY_LANGUAGE[language as Language] ?? ['Unknown'];
  const framework = await select({
    message: 'Framework',
    options: frameworkOptions.map((item) => ({ label: item, value: item })),
  });
  if (isCancel(framework)) abort();

  const dockerEnabled = await select({
    message: 'Deploy with Docker?',
    options: [
      { label: 'Yes', value: true },
      { label: 'No', value: false },
    ],
  });
  if (isCancel(dockerEnabled)) abort();

  const database = await select({
    message: 'Database engine',
    options: ALL_DATABASES.map((item) => ({ label: item, value: item })),
  });
  if (isCancel(database)) abort();

  const databaseVersion = await text({
    message: 'Database version',
    defaultValue:
      database === 'none'
        ? '-'
        : base.databaseVersion ?? DATABASE_VERSION_PLACEHOLDERS[database as Database],
    placeholder: DATABASE_VERSION_PLACEHOLDERS[database as Database],
  });
  if (isCancel(databaseVersion)) abort();

  const stackInput = await text({
    message: 'Stack / technologies',
    placeholder: 'e.g. Node.js, TypeScript, PostgreSQL, Redis',
    defaultValue: [
      ...base.stack,
      String(language),
      String(framework),
      database !== 'none' ? String(database) : '',
      dockerEnabled ? 'docker' : 'no-docker',
    ]
      .filter(Boolean)
      .join(', '),
  });
  if (isCancel(stackInput)) abort();

  const devCommand = await text({
    message: 'Dev command',
    defaultValue: base.devCommand ?? '',
    placeholder: 'npm run dev',
  });
  if (isCancel(devCommand)) abort();

  const buildCommand = await text({
    message: 'Build command',
    defaultValue: base.buildCommand ?? '',
    placeholder: 'npm run build',
  });
  if (isCancel(buildCommand)) abort();

  const testCommand = await text({
    message: 'Test command',
    defaultValue: base.testCommand ?? '',
    placeholder: 'npm test',
  });
  if (isCancel(testCommand)) abort();

  const lintCommand = await text({
    message: 'Lint command',
    defaultValue: base.lintCommand ?? '',
    placeholder: 'npm run lint',
  });
  if (isCancel(lintCommand)) abort();

  return {
    ...base,
    name: String(name).trim(),
    description: String(description).trim(),
    language: language as Language,
    languageVersion: String(languageVersion).trim(),
    framework: String(framework),
    dockerEnabled: Boolean(dockerEnabled),
    database: database as Database,
    databaseVersion: database === 'none' ? '' : String(databaseVersion).trim(),
    stack: splitCsv(String(stackInput)),
    devCommand: normalizeOptional(String(devCommand)),
    buildCommand: normalizeOptional(String(buildCommand)),
    testCommand: normalizeOptional(String(testCommand)),
    lintCommand: normalizeOptional(String(lintCommand)),
  };
}

function safeReadText(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function abort(): never {
  cancel('Ctrl + C pressed. Quit.');
  process.exit(SIGINT_EXIT_CODE);
}

function printSummary(answers: InitAnswers, writtenFiles: string[]): void {
  console.log();
  log.info(`Project: ${answers.projectInfo.name}`);
  log.info(`Path: ${answers.projectRoot}`);
  log.info(`Providers: ${answers.providers.join(', ')}`);
  log.info(`IDE: ${answers.ide}`);
  log.info(`Language: ${answers.projectInfo.language ?? 'unknown'} ${answers.projectInfo.languageVersion ?? ''}`);
  log.info(`Framework: ${answers.projectInfo.framework ?? 'not specified'}`);
  log.info(`Docker: ${answers.projectInfo.dockerEnabled ? 'yes' : 'no'}`);
  log.info(`Content mode: ${answers.contentMode}`);
  log.info(
    `Database: ${
      answers.projectInfo.database && answers.projectInfo.database !== 'none'
        ? `${answers.projectInfo.database} ${answers.projectInfo.databaseVersion ?? ''}`.trim()
        : 'none'
    }`,
  );
  log.info(`Roles: ${answers.roles.join(', ')}`);

  console.log(pc.bold('\nGenerated files:'));
  for (const file of writtenFiles) {
    console.log(pc.green(`  + ${file}`));
  }
}
