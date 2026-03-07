import { renderAgentsMd, buildTemplateContext, renderCommandList } from './templates.js';
import { emptyProjectInfo, scriptCommand } from './project.js';
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

  const projectInfo = emptyProjectInfo('demo');
  assert(projectInfo.repoType === 'unknown', 'emptyProjectInfo should set unknown repo type');
  assert(projectInfo.name === 'demo', 'emptyProjectInfo should preserve name');

  const answers: InitAnswers = {
    projectRoot: '/tmp/demo',
    providers: ['claude', 'cursor'],
    ide: 'cursor',
    detectionMode: 'manual',
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

  console.log('All self-tests passed.');
}