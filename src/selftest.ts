import fs from 'fs';
import os from 'os';
import path from 'path';
import { planAgentUpFiles } from './generator.js';
import {
  renderAgentsMd,
  buildTemplateContext,
  renderCommandList,
  renderClaudeMcp,
  renderCursorMcp,
} from './templates.js';
import { emptyProjectInfo, scriptCommand, detectProjectInfo } from './project.js';
import { assert, normalizeOptional, splitCsv } from './utils.js';
import type { InitAnswers } from './types.js';

export function runSelfTests(): void {
  const splitResult = splitCsv('Node.js, TypeScript, Node.js, Redis');
  assert(splitResult.length === 3, 'splitCsv should deduplicate values');
  assert(splitResult[0] === 'Node.js', 'splitCsv should preserve order');

  assert(normalizeOptional('   ') === undefined, 'normalizeOptional should return undefined for blank strings');
  assert(normalizeOptional(' npm test ') === 'npm test', 'normalizeOptional should trim values');

  const cmd1 = scriptCommand('npm', 'build', 'vite build');
  assert(cmd1 === 'npm run build', 'scriptCommand should build npm run command');

  const cmd2 = scriptCommand('pnpm', 'test', 'vitest');
  assert(cmd2 === 'pnpm test', 'scriptCommand should build pnpm command');

  const cmd3 = scriptCommand('yarn', 'dev', 'next dev');
  assert(cmd3 === 'yarn dev', 'scriptCommand should build yarn command');

  const commandList = renderCommandList({ test: 'npm test', lint: 'npm run lint' });
  assert(commandList.includes('npm test'), 'renderCommandList should include test command');
  assert(commandList.includes('npm run lint'), 'renderCommandList should include lint command');

  const fallbackList = renderCommandList({});
  assert(fallbackList === '- No commands configured yet', 'renderCommandList should provide fallback text');

  const claudeMcp = renderClaudeMcp();
  assert(
    'mcpServers' in claudeMcp &&
      typeof claudeMcp.mcpServers === 'object' &&
      claudeMcp.mcpServers !== null &&
      Object.keys(claudeMcp.mcpServers as Record<string, unknown>).length === 0,
    'renderClaudeMcp should not reference missing example scripts',
  );

  const cursorMcp = renderCursorMcp();
  assert(
    'mcpServers' in cursorMcp &&
      typeof cursorMcp.mcpServers === 'object' &&
      cursorMcp.mcpServers !== null &&
      Object.keys(cursorMcp.mcpServers as Record<string, unknown>).length === 0,
    'renderCursorMcp should not reference missing example scripts',
  );

  const projectInfo = emptyProjectInfo('demo');
  assert(projectInfo.repoType === 'unknown', 'emptyProjectInfo should set unknown repo type');
  assert(projectInfo.name === 'demo', 'emptyProjectInfo should preserve name');

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agentup-selftest-'));
  try {
    const phpRoot = path.join(tmpRoot, 'php-project');
    fs.mkdirSync(phpRoot, { recursive: true });
    fs.writeFileSync(
      path.join(phpRoot, 'composer.json'),
      JSON.stringify({ name: 'acme/demo-app', description: 'Composer app' }, null, 2),
      'utf8',
    );
    const detectedPhp = detectProjectInfo(phpRoot);
    assert(detectedPhp.name === 'demo-app', 'detectProjectInfo should infer name from composer package');
    assert(detectedPhp.description === 'Composer app', 'detectProjectInfo should infer description from composer');
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }

  const answers: InitAnswers = {
    projectRoot: '/tmp/demo',
    providers: ['claude', 'cursor'],
    ide: 'cursor',
    detectionMode: 'manual',
    contentMode: 'template',
    roles: ['plan', 'review'],
    overwriteMode: 'replace',
    createClaudeDir: true,
    createCursorDir: true,
    projectInfo: {
      ...projectInfo,
      description: 'demo project',
      language: 'php',
      languageVersion: '8.3',
      framework: 'Yii2',
      dockerEnabled: true,
      database: 'postgresql',
      databaseVersion: '17',
      stack: ['PHP', 'Yii2', 'PostgreSQL'],
    },
  };

  const ctx = buildTemplateContext(answers);
  const agents = renderAgentsMd(ctx);

  assert(agents.includes('Language: php'), 'renderAgentsMd should include language');
  assert(agents.includes('Language version: 8.3'), 'renderAgentsMd should include language version');
  assert(agents.includes('Framework: Yii2'), 'renderAgentsMd should include framework');
  assert(agents.includes('Deploy with Docker: yes'), 'renderAgentsMd should include docker');
  assert(agents.includes('Database: postgresql 17'), 'renderAgentsMd should include database');

  const codexOnlyPlan = planAgentUpFiles({
    ...answers,
    providers: ['codex'],
    createCursorDir: true,
    createClaudeDir: true,
  });
  assert(
    !codexOnlyPlan.some((file) => file.relativePath.startsWith('.cursor/')),
    'planAgentUpFiles should not generate .cursor files when cursor provider is not selected',
  );
  assert(
    codexOnlyPlan.some((file) => file.relativePath === 'AGENTS.md'),
    'planAgentUpFiles should include AGENTS.md for codex provider',
  );

  const cursorOnlyPlan = planAgentUpFiles({
    ...answers,
    providers: ['cursor'],
    createCursorDir: false,
    createClaudeDir: false,
  });
  assert(
    cursorOnlyPlan.some((file) => file.relativePath.startsWith('.cursor/')),
    'planAgentUpFiles should generate .cursor files when cursor provider is selected',
  );

  console.log('All self-tests passed.');
}
