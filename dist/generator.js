import fs from 'fs';
import path from 'path';
import { buildTemplateContext, renderAgentUpManifest, renderAgentsMd, renderClaudeAgent, renderClaudeCommand, renderClaudeHooksReadme, renderClaudeMcp, renderClaudeOutputRule, renderClaudeProjectRule, renderClaudeRoot, renderClaudeSettings, renderClaudeSettingsLocalExample, renderClaudeSkill, renderClaudeVerificationRule, renderCursorAgent, renderCursorArchitectureDoc, renderCursorCommand, renderCursorHooksReadme, renderCursorMcp, renderCursorReadme, renderCursorRule, renderCursorSkill, } from './templates.js';
export function planAgentUpFiles(answers, overrides = {}) {
    const plannedByPath = new Map();
    const ctx = buildTemplateContext(answers);
    const addFile = (filePath, content) => {
        const relativePath = normalizeRelativePath(path.relative(answers.projectRoot, filePath) || path.basename(filePath));
        const overridden = overrides[relativePath];
        plannedByPath.set(filePath, {
            absolutePath: filePath,
            relativePath,
            content: overridden ?? content,
        });
    };
    addFile(path.join(answers.projectRoot, 'AGENTS.md'), renderAgentsMd(ctx));
    if (answers.createClaudeDir) {
        addFile(path.join(answers.projectRoot, 'CLAUDE.md'), renderClaudeRoot());
    }
    addFile(path.join(answers.projectRoot, '.agentup.json'), `${JSON.stringify(renderAgentUpManifest(answers), null, 2)}\n`);
    if (answers.createClaudeDir) {
        createClaudeScaffold(answers, ctx, addFile);
    }
    if (answers.createCursorDir) {
        createCursorScaffold(answers, ctx, addFile);
    }
    return [...plannedByPath.values()];
}
function createClaudeScaffold(answers, ctx, addFile) {
    const base = path.join(answers.projectRoot, '.claude');
    addFile(path.join(base, 'settings.json'), `${JSON.stringify(renderClaudeSettings(answers), null, 2)}\n`);
    addFile(path.join(base, 'settings.local.example.json'), `${JSON.stringify(renderClaudeSettingsLocalExample(), null, 2)}\n`);
    addFile(path.join(base, '.mcp.json'), `${JSON.stringify(renderClaudeMcp(), null, 2)}\n`);
    addFile(path.join(base, 'rules', 'project-core.md'), renderClaudeProjectRule(ctx));
    addFile(path.join(base, 'rules', 'verification.md'), renderClaudeVerificationRule(ctx));
    addFile(path.join(base, 'rules', 'agentup-output.md'), renderClaudeOutputRule());
    if (answers.roles.includes('plan')) {
        addFile(path.join(base, 'commands', 'plan.md'), renderClaudeCommand('plan', ctx));
        addFile(path.join(base, 'skills', 'plan-workflow', 'SKILL.md'), renderClaudeSkill('plan', ctx));
        addFile(path.join(base, 'agents', 'planner.md'), renderClaudeAgent('plan', ctx));
    }
    if (answers.roles.includes('review')) {
        addFile(path.join(base, 'commands', 'review.md'), renderClaudeCommand('review', ctx));
        addFile(path.join(base, 'skills', 'review-workflow', 'SKILL.md'), renderClaudeSkill('review', ctx));
        addFile(path.join(base, 'agents', 'reviewer.md'), renderClaudeAgent('review', ctx));
    }
    if (answers.roles.includes('test')) {
        addFile(path.join(base, 'commands', 'test.md'), renderClaudeCommand('test', ctx));
        addFile(path.join(base, 'skills', 'test-workflow', 'SKILL.md'), renderClaudeSkill('test', ctx));
        addFile(path.join(base, 'agents', 'tester.md'), renderClaudeAgent('test', ctx));
    }
    if (answers.roles.includes('code')) {
        addFile(path.join(base, 'commands', 'implement.md'), renderClaudeCommand('code', ctx));
        addFile(path.join(base, 'skills', 'code-workflow', 'SKILL.md'), renderClaudeSkill('code', ctx));
        addFile(path.join(base, 'agents', 'implementer.md'), renderClaudeAgent('code', ctx));
    }
    addFile(path.join(base, 'hooks', 'README.md'), renderClaudeHooksReadme(ctx));
}
function createCursorScaffold(answers, ctx, addFile) {
    const base = path.join(answers.projectRoot, '.cursor');
    addFile(path.join(base, 'README.md'), renderCursorReadme(ctx));
    addFile(path.join(base, 'mcp.json'), `${JSON.stringify(renderCursorMcp(), null, 2)}\n`);
    addFile(path.join(base, 'rules', '00-project-core.mdc'), renderCursorRule('project-core', ctx));
    addFile(path.join(base, 'rules', '10-verification.mdc'), renderCursorRule('verification', ctx));
    addFile(path.join(base, 'rules', '20-output-style.mdc'), renderCursorRule('output-style', ctx));
    if (answers.roles.includes('plan')) {
        addFile(path.join(base, 'commands', 'plan.md'), renderCursorCommand('plan', ctx));
        addFile(path.join(base, 'skills', 'plan-workflow', 'SKILL.md'), renderCursorSkill('plan', ctx));
        addFile(path.join(base, 'agents', 'planner.md'), renderCursorAgent('plan', ctx));
    }
    if (answers.roles.includes('review')) {
        addFile(path.join(base, 'commands', 'review.md'), renderCursorCommand('review', ctx));
        addFile(path.join(base, 'skills', 'review-workflow', 'SKILL.md'), renderCursorSkill('review', ctx));
        addFile(path.join(base, 'agents', 'reviewer.md'), renderCursorAgent('review', ctx));
    }
    if (answers.roles.includes('test')) {
        addFile(path.join(base, 'commands', 'test.md'), renderCursorCommand('test', ctx));
        addFile(path.join(base, 'skills', 'test-workflow', 'SKILL.md'), renderCursorSkill('test', ctx));
        addFile(path.join(base, 'agents', 'tester.md'), renderCursorAgent('test', ctx));
    }
    if (answers.roles.includes('code')) {
        addFile(path.join(base, 'commands', 'implement.md'), renderCursorCommand('code', ctx));
        addFile(path.join(base, 'skills', 'code-workflow', 'SKILL.md'), renderCursorSkill('code', ctx));
        addFile(path.join(base, 'agents', 'implementer.md'), renderCursorAgent('code', ctx));
    }
    addFile(path.join(base, 'docs', 'architecture.md'), renderCursorArchitectureDoc(ctx));
    addFile(path.join(base, 'hooks', 'README.md'), renderCursorHooksReadme(ctx));
}
export function writeAgentUpFiles(plannedFiles) {
    const written = [];
    for (const file of plannedFiles) {
        ensureDir(path.dirname(file.absolutePath));
        fs.writeFileSync(file.absolutePath, file.content, 'utf8');
        written.push(file.relativePath);
    }
    return written;
}
export function applyOverwriteMode(plannedFiles, overwriteMode) {
    return plannedFiles.filter((file) => {
        const exists = fs.existsSync(file.absolutePath);
        if (!exists)
            return true;
        if (overwriteMode === 'replace')
            return true;
        return false;
    });
}
export function generateAgentUpFiles(answers, overrides = {}) {
    const plannedFiles = planAgentUpFiles(answers, overrides);
    const safeMode = answers.overwriteMode === 'ask' ? 'skip' : answers.overwriteMode;
    const filtered = applyOverwriteMode(plannedFiles, safeMode);
    return writeAgentUpFiles(filtered);
}
function normalizeRelativePath(relativePath) {
    if (path.sep === '/') {
        return relativePath;
    }
    return relativePath.split(path.sep).join('/');
}
function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}
