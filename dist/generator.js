import fs from 'fs';
import path from 'path';
import { buildTemplateContext, renderAgentUpManifest, renderAgentsMd, renderClaudeAgent, renderClaudeCommand, renderClaudeHooksReadme, renderClaudeMcp, renderClaudeOutputRule, renderClaudeProjectRule, renderClaudeRoot, renderClaudeSettings, renderClaudeSettingsLocalExample, renderClaudeSkill, renderClaudeVerificationRule, renderCursorAgent, renderCursorArchitectureDoc, renderCursorCommand, renderCursorHooksReadme, renderCursorMcp, renderCursorReadme, renderCursorRule, renderCursorSkill, } from './templates.js';
export function generateAgentUpFiles(answers) {
    const written = [];
    const ctx = buildTemplateContext(answers);
    maybeWriteFile(answers, path.join(answers.projectRoot, 'AGENTS.md'), renderAgentsMd(ctx), written);
    maybeWriteFile(answers, path.join(answers.projectRoot, 'CLAUDE.md'), renderClaudeRoot(), written);
    maybeWriteFile(answers, path.join(answers.projectRoot, '.agentup.json'), `${JSON.stringify(renderAgentUpManifest(answers), null, 2)}\n`, written);
    if (answers.createClaudeDir) {
        createClaudeScaffold(answers, ctx, written);
    }
    if (answers.createCursorDir) {
        createCursorScaffold(answers, ctx, written);
    }
    return written;
}
function createClaudeScaffold(answers, ctx, written) {
    const base = path.join(answers.projectRoot, '.claude');
    const dirs = [
        base,
        path.join(base, 'rules'),
        path.join(base, 'commands'),
        path.join(base, 'skills', 'plan-workflow'),
        path.join(base, 'skills', 'review-workflow'),
        path.join(base, 'skills', 'test-workflow'),
        path.join(base, 'skills', 'code-workflow'),
        path.join(base, 'agents'),
        path.join(base, 'hooks'),
    ];
    dirs.forEach(ensureDir);
    maybeWriteFile(answers, path.join(base, 'settings.json'), `${JSON.stringify(renderClaudeSettings(answers), null, 2)}\n`, written);
    maybeWriteFile(answers, path.join(base, 'settings.local.example.json'), `${JSON.stringify(renderClaudeSettingsLocalExample(), null, 2)}\n`, written);
    maybeWriteFile(answers, path.join(base, '.mcp.json'), `${JSON.stringify(renderClaudeMcp(), null, 2)}\n`, written);
    maybeWriteFile(answers, path.join(base, 'rules', 'project-core.md'), renderClaudeProjectRule(ctx), written);
    maybeWriteFile(answers, path.join(base, 'rules', 'verification.md'), renderClaudeVerificationRule(ctx), written);
    maybeWriteFile(answers, path.join(base, 'rules', 'agentup-output.md'), renderClaudeOutputRule(), written);
    if (answers.roles.includes('plan')) {
        maybeWriteFile(answers, path.join(base, 'commands', 'plan.md'), renderClaudeCommand('plan', ctx), written);
        maybeWriteFile(answers, path.join(base, 'skills', 'plan-workflow', 'SKILL.md'), renderClaudeSkill('plan', ctx), written);
        maybeWriteFile(answers, path.join(base, 'agents', 'planner.md'), renderClaudeAgent('plan', ctx), written);
    }
    if (answers.roles.includes('review')) {
        maybeWriteFile(answers, path.join(base, 'commands', 'review.md'), renderClaudeCommand('review', ctx), written);
        maybeWriteFile(answers, path.join(base, 'skills', 'review-workflow', 'SKILL.md'), renderClaudeSkill('review', ctx), written);
        maybeWriteFile(answers, path.join(base, 'agents', 'reviewer.md'), renderClaudeAgent('review', ctx), written);
    }
    if (answers.roles.includes('test')) {
        maybeWriteFile(answers, path.join(base, 'commands', 'test.md'), renderClaudeCommand('test', ctx), written);
        maybeWriteFile(answers, path.join(base, 'skills', 'test-workflow', 'SKILL.md'), renderClaudeSkill('test', ctx), written);
        maybeWriteFile(answers, path.join(base, 'agents', 'tester.md'), renderClaudeAgent('test', ctx), written);
    }
    if (answers.roles.includes('code')) {
        maybeWriteFile(answers, path.join(base, 'commands', 'implement.md'), renderClaudeCommand('code', ctx), written);
        maybeWriteFile(answers, path.join(base, 'skills', 'code-workflow', 'SKILL.md'), renderClaudeSkill('code', ctx), written);
        maybeWriteFile(answers, path.join(base, 'agents', 'implementer.md'), renderClaudeAgent('code', ctx), written);
    }
    maybeWriteFile(answers, path.join(base, 'hooks', 'README.md'), renderClaudeHooksReadme(ctx), written);
}
function createCursorScaffold(answers, ctx, written) {
    const base = path.join(answers.projectRoot, '.cursor');
    const dirs = [
        base,
        path.join(base, 'rules'),
        path.join(base, 'commands'),
        path.join(base, 'skills', 'plan-workflow'),
        path.join(base, 'skills', 'review-workflow'),
        path.join(base, 'skills', 'test-workflow'),
        path.join(base, 'skills', 'code-workflow'),
        path.join(base, 'agents'),
        path.join(base, 'docs'),
        path.join(base, 'hooks'),
    ];
    dirs.forEach(ensureDir);
    maybeWriteFile(answers, path.join(base, 'README.md'), renderCursorReadme(ctx), written);
    maybeWriteFile(answers, path.join(base, 'mcp.json'), `${JSON.stringify(renderCursorMcp(), null, 2)}\n`, written);
    maybeWriteFile(answers, path.join(base, 'rules', '00-project-core.mdc'), renderCursorRule('project-core', ctx), written);
    maybeWriteFile(answers, path.join(base, 'rules', '10-verification.mdc'), renderCursorRule('verification', ctx), written);
    maybeWriteFile(answers, path.join(base, 'rules', '20-output-style.mdc'), renderCursorRule('output-style', ctx), written);
    if (answers.roles.includes('plan')) {
        maybeWriteFile(answers, path.join(base, 'commands', 'plan.md'), renderCursorCommand('plan', ctx), written);
        maybeWriteFile(answers, path.join(base, 'skills', 'plan-workflow', 'SKILL.md'), renderCursorSkill('plan', ctx), written);
        maybeWriteFile(answers, path.join(base, 'agents', 'planner.md'), renderCursorAgent('plan', ctx), written);
    }
    if (answers.roles.includes('review')) {
        maybeWriteFile(answers, path.join(base, 'commands', 'review.md'), renderCursorCommand('review', ctx), written);
        maybeWriteFile(answers, path.join(base, 'skills', 'review-workflow', 'SKILL.md'), renderCursorSkill('review', ctx), written);
        maybeWriteFile(answers, path.join(base, 'agents', 'reviewer.md'), renderCursorAgent('review', ctx), written);
    }
    if (answers.roles.includes('test')) {
        maybeWriteFile(answers, path.join(base, 'commands', 'test.md'), renderCursorCommand('test', ctx), written);
        maybeWriteFile(answers, path.join(base, 'skills', 'test-workflow', 'SKILL.md'), renderCursorSkill('test', ctx), written);
        maybeWriteFile(answers, path.join(base, 'agents', 'tester.md'), renderCursorAgent('test', ctx), written);
    }
    if (answers.roles.includes('code')) {
        maybeWriteFile(answers, path.join(base, 'commands', 'implement.md'), renderCursorCommand('code', ctx), written);
        maybeWriteFile(answers, path.join(base, 'skills', 'code-workflow', 'SKILL.md'), renderCursorSkill('code', ctx), written);
        maybeWriteFile(answers, path.join(base, 'agents', 'implementer.md'), renderCursorAgent('code', ctx), written);
    }
    maybeWriteFile(answers, path.join(base, 'docs', 'architecture.md'), renderCursorArchitectureDoc(ctx), written);
    maybeWriteFile(answers, path.join(base, 'hooks', 'README.md'), renderCursorHooksReadme(ctx), written);
}
function maybeWriteFile(answers, filePath, content, written) {
    ensureDir(path.dirname(filePath));
    const exists = fs.existsSync(filePath);
    if (exists && answers.overwriteMode === 'skip') {
        return;
    }
    fs.writeFileSync(filePath, content, 'utf8');
    written.push(path.relative(answers.projectRoot, filePath) || path.basename(filePath));
}
function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}
