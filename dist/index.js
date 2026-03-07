#!/usr/bin/env node
import process from 'process';
import path from 'path';
import { cancel, intro, isCancel, log, multiselect, outro, select, spinner, text, } from '@clack/prompts';
import pc from 'picocolors';
import { ALL_DATABASES, ALL_LANGUAGES, DATABASE_VERSION_PLACEHOLDERS, FRAMEWORKS_BY_LANGUAGE, LANGUAGE_VERSION_PLACEHOLDERS, } from './types.js';
import { getArgv, getCwd } from './runtime.js';
import { generateAgentUpFiles } from './generator.js';
import { detectProjectInfo, emptyProjectInfo } from './project.js';
import { normalizeOptional, splitCsv } from './utils.js';
const argv = getArgv();
const command = argv[0];
void main();
async function main() {
    if (command === '__selftest') {
        const { runSelfTests } = await import('./selftest.js');
        runSelfTests();
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
    intro(pc.bgCyan(pc.black(' AgentUp ')) + ' ' + pc.dim('bootstrap AI-agent project context'));
    const answers = await collectAnswers();
    const s = spinner();
    s.start('Generating project agent scaffolding...');
    try {
        const writtenFiles = generateAgentUpFiles(answers);
        s.stop(`Generated ${writtenFiles.length} file(s)`);
        log.success('AgentUp initialization complete');
        printSummary(answers, writtenFiles);
        outro(pc.green('Done. Repo has agent context now.'));
    }
    catch (error) {
        s.stop('Generation failed');
        console.error(pc.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
    }
}
function printHelp() {
    console.log(`
AgentUp CLI

Usage:
  agentup-cli init
  agentup-cli __selftest
  agentup-cli --help
`);
}
async function collectAnswers() {
    const rootInput = await text({
        message: 'Project path',
        placeholder: getCwd(),
        defaultValue: getCwd(),
        validate(value) {
            if (!value || !String(value).trim())
                return 'Project path is required';
            return undefined;
        },
    });
    if (isCancel(rootInput))
        abort();
    const projectRoot = path.resolve(String(rootInput));
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
    if (isCancel(providers))
        abort();
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
    if (isCancel(ide))
        abort();
    const detectionMode = await select({
        message: 'Project context source',
        options: [
            { label: 'Auto-detect from project files', value: 'auto' },
            { label: 'Manual input', value: 'manual' },
        ],
    });
    if (isCancel(detectionMode))
        abort();
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
    if (isCancel(roles))
        abort();
    const overwriteMode = await select({
        message: 'When a file already exists',
        options: [
            { label: 'Skip existing files', value: 'skip' },
            { label: 'Replace generated files', value: 'replace' },
        ],
    });
    if (isCancel(overwriteMode))
        abort();
    const detected = detectionMode === 'auto'
        ? detectProjectInfo(projectRoot)
        : emptyProjectInfo(path.basename(projectRoot));
    const projectInfo = await refineProjectInfo(projectRoot, detected);
    const providerList = providers;
    return {
        projectRoot,
        providers: providerList,
        ide: ide,
        detectionMode: detectionMode,
        roles: roles,
        overwriteMode: overwriteMode,
        projectInfo,
        createClaudeDir: providerList.includes('claude'),
        createCursorDir: providerList.includes('cursor'),
    };
}
async function refineProjectInfo(projectRoot, base) {
    const name = await text({
        message: 'Project name',
        defaultValue: base.name || path.basename(projectRoot),
        validate(value) {
            if (!value || !String(value).trim())
                return 'Project name is required';
            return undefined;
        },
    });
    if (isCancel(name))
        abort();
    const description = await text({
        message: 'Project description',
        placeholder: 'What does this project do?',
        defaultValue: base.description,
        validate(value) {
            if (!value || !String(value).trim())
                return 'Description is required';
            return undefined;
        },
    });
    if (isCancel(description))
        abort();
    const language = await select({
        message: 'Programming language',
        options: ALL_LANGUAGES.map((item) => ({ label: item, value: item })),
    });
    if (isCancel(language))
        abort();
    const languageVersion = await text({
        message: 'Language version',
        defaultValue: base.languageVersion ?? LANGUAGE_VERSION_PLACEHOLDERS[language],
        placeholder: LANGUAGE_VERSION_PLACEHOLDERS[language],
    });
    if (isCancel(languageVersion))
        abort();
    const frameworkOptions = FRAMEWORKS_BY_LANGUAGE[language] ?? ['Unknown'];
    const framework = await select({
        message: 'Framework',
        options: frameworkOptions.map((item) => ({ label: item, value: item })),
    });
    if (isCancel(framework))
        abort();
    const dockerEnabled = await select({
        message: 'Deploy with Docker?',
        options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
        ],
    });
    if (isCancel(dockerEnabled))
        abort();
    const database = await select({
        message: 'Database engine',
        options: ALL_DATABASES.map((item) => ({ label: item, value: item })),
    });
    if (isCancel(database))
        abort();
    const databaseVersion = await text({
        message: 'Database version',
        defaultValue: database === 'none'
            ? '-'
            : base.databaseVersion ?? DATABASE_VERSION_PLACEHOLDERS[database],
        placeholder: DATABASE_VERSION_PLACEHOLDERS[database],
    });
    if (isCancel(databaseVersion))
        abort();
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
    if (isCancel(stackInput))
        abort();
    const devCommand = await text({
        message: 'Dev command',
        defaultValue: base.devCommand ?? '',
        placeholder: 'npm run dev',
    });
    if (isCancel(devCommand))
        abort();
    const buildCommand = await text({
        message: 'Build command',
        defaultValue: base.buildCommand ?? '',
        placeholder: 'npm run build',
    });
    if (isCancel(buildCommand))
        abort();
    const testCommand = await text({
        message: 'Test command',
        defaultValue: base.testCommand ?? '',
        placeholder: 'npm test',
    });
    if (isCancel(testCommand))
        abort();
    const lintCommand = await text({
        message: 'Lint command',
        defaultValue: base.lintCommand ?? '',
        placeholder: 'npm run lint',
    });
    if (isCancel(lintCommand))
        abort();
    return {
        ...base,
        name: String(name).trim(),
        description: String(description).trim(),
        language: language,
        languageVersion: String(languageVersion).trim(),
        framework: String(framework),
        dockerEnabled: Boolean(dockerEnabled),
        database: database,
        databaseVersion: database === 'none' ? '' : String(databaseVersion).trim(),
        stack: splitCsv(String(stackInput)),
        devCommand: normalizeOptional(String(devCommand)),
        buildCommand: normalizeOptional(String(buildCommand)),
        testCommand: normalizeOptional(String(testCommand)),
        lintCommand: normalizeOptional(String(lintCommand)),
    };
}
function abort() {
    cancel('Operation cancelled');
    process.exit(0);
}
function printSummary(answers, writtenFiles) {
    console.log();
    log.info(`Project: ${answers.projectInfo.name}`);
    log.info(`Path: ${answers.projectRoot}`);
    log.info(`Providers: ${answers.providers.join(', ')}`);
    log.info(`IDE: ${answers.ide}`);
    log.info(`Language: ${answers.projectInfo.language ?? 'unknown'} ${answers.projectInfo.languageVersion ?? ''}`);
    log.info(`Framework: ${answers.projectInfo.framework ?? 'not specified'}`);
    log.info(`Docker: ${answers.projectInfo.dockerEnabled ? 'yes' : 'no'}`);
    log.info(`Database: ${answers.projectInfo.database && answers.projectInfo.database !== 'none'
        ? `${answers.projectInfo.database} ${answers.projectInfo.databaseVersion ?? ''}`.trim()
        : 'none'}`);
    log.info(`Roles: ${answers.roles.join(', ')}`);
    console.log(pc.bold('\nGenerated files:'));
    for (const file of writtenFiles) {
        console.log(pc.green(`  + ${file}`));
    }
}
