import fs from 'fs';
import path from 'path';
import type { PlannedFile } from './generator.js';

type AiOverridesResult = {
  overrides: Record<string, string>;
  warning?: string;
};

const TARGET_PATHS = new Set<string>([
  'AGENTS.md',
  'CLAUDE.md',
  '.claude/rules/project-core.md',
  '.cursor/rules/00-project-core.mdc',
  '.cursor/docs/architecture.md',
]);

const SNAPSHOT_LIMIT = 80;
const SNIPPET_LIMIT_BYTES = 4000;
const SNAPSHOT_FILES = [
  'README.md',
  'package.json',
  'tsconfig.json',
  'pyproject.toml',
  'composer.json',
  'go.mod',
  'Cargo.toml',
  'pom.xml',
  'build.gradle',
];

export async function generateAiOverrides(
  projectRoot: string,
  plannedFiles: PlannedFile[],
): Promise<AiOverridesResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { overrides: {}, warning: 'GEMINI_API_KEY is not set, using template output.' };
  }

  const targetFiles = plannedFiles.filter((file) => TARGET_PATHS.has(file.relativePath));
  if (targetFiles.length === 0) {
    return { overrides: {} };
  }

  const baseline = Object.fromEntries(targetFiles.map((file) => [file.relativePath, file.content]));
  const snapshot = buildProjectSnapshot(projectRoot);

  const systemPrompt = [
    'You are an expert software reviewer.',
    'Improve generated project guidance files so they are specific, practical, and consistent with the repository snapshot.',
    'Preserve each file format (Markdown/frontmatter style) and return only valid JSON.',
    'Output schema: {"files": {"relative/path.md": "new content"}}.',
    'Only include paths that were provided.',
  ].join(' ');

  const userPrompt = [
    'Repository snapshot:',
    snapshot,
    '',
    'Current generated files:',
    JSON.stringify(baseline, null, 2),
  ].join('\n');

  const modelCandidates = buildGeminiModelCandidates();
  let lastWarning: string | undefined;

  for (const model of modelCandidates) {
    const geminiResult = await requestGeminiJson(apiKey, model, systemPrompt, userPrompt);
    if (geminiResult.error) {
      lastWarning = `AI request failed for ${model}. Using template output. ${geminiResult.error}`;
      continue;
    }

    if (!geminiResult.text) {
      lastWarning = `AI returned empty content for ${model}, using template output.`;
      continue;
    }

    const parsed = safeJsonParse(geminiResult.text);
    if (!parsed || typeof parsed !== 'object') {
      lastWarning = `AI response from ${model} was not valid JSON, using template output.`;
      continue;
    }

    const files = (parsed as { files?: unknown }).files;
    if (!files || typeof files !== 'object') {
      lastWarning = `AI returned no file map for ${model}, using template output.`;
      continue;
    }

    const overrides: Record<string, string> = {};
    for (const [relativePath, value] of Object.entries(files as Record<string, unknown>)) {
      if (!TARGET_PATHS.has(relativePath)) continue;
      if (typeof value !== 'string' || !value.trim()) continue;
      overrides[relativePath] = value.endsWith('\n') ? value : `${value}\n`;
    }

    if (Object.keys(overrides).length > 0) {
      return { overrides };
    }
    lastWarning = `AI returned no usable overrides for ${model}, using template output.`;
  }

  return {
    overrides: {},
    warning: lastWarning ?? 'AI review failed, using template output.',
  };
}

type GeminiRequestResult = {
  text: string;
  error?: undefined;
} | {
  text?: undefined;
  error: string;
};

async function requestGeminiJson(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<GeminiRequestResult> {
  try {
    const prompt = `${systemPrompt}\n\n${userPrompt}`;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model,
      )}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      return { error: `${response.status}: ${body.slice(0, 280)}` };
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };
    const rawContent =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => (typeof part.text === 'string' ? part.text : ''))
        .join('\n')
        .trim() ?? '';
    if (!rawContent) {
      return { error: 'empty response content' };
    }

    return { text: rawContent };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function buildGeminiModelCandidates(): string[] {
  const preferred = normalizeOptional(process.env.AGENTUP_GEMINI_MODEL);
  const candidates = [
    preferred,
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ].filter((model): model is string => Boolean(model));

  return [...new Set(candidates)];
}

function normalizeOptional(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function buildProjectSnapshot(projectRoot: string): string {
  const lines: string[] = [];
  lines.push(`Project root: ${projectRoot}`);

  const fileTree = collectFiles(projectRoot, projectRoot, 0, 3);
  lines.push('Repository files (truncated):');
  for (const file of fileTree.slice(0, SNAPSHOT_LIMIT)) {
    lines.push(`- ${file}`);
  }

  lines.push('');
  lines.push('Key file snippets:');
  for (const fileName of SNAPSHOT_FILES) {
    const fullPath = path.join(projectRoot, fileName);
    if (!fs.existsSync(fullPath)) continue;
    const snippet = readFileSnippet(fullPath, SNIPPET_LIMIT_BYTES);
    if (!snippet.trim()) continue;
    lines.push(`--- ${fileName} ---`);
    lines.push(snippet);
  }

  return lines.join('\n');
}

function collectFiles(baseRoot: string, currentRoot: string, depth: number, maxDepth: number): string[] {
  if (depth > maxDepth) return [];
  const entries = safeReadDir(currentRoot);
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.git')) continue;
    if (entry.name === 'node_modules') continue;
    if (entry.name === 'dist') continue;
    if (entry.name === '.cursor') continue;
    if (entry.name === '.claude') continue;

    const fullPath = path.join(currentRoot, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(baseRoot, fullPath, depth + 1, maxDepth));
      continue;
    }

    const relativePath = normalizeRelativePath(path.relative(baseRoot, fullPath));
    if (!isTextLike(relativePath)) continue;
    files.push(relativePath);
  }

  return files.sort();
}

function safeReadDir(dirPath: string): fs.Dirent[] {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

function readFileSnippet(filePath: string, byteLimit: number): string {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw.slice(0, byteLimit);
  } catch {
    return '';
  }
}

function isTextLike(relativePath: string): boolean {
  const ext = path.extname(relativePath).toLowerCase();
  return (
    ext === '' ||
    ext === '.md' ||
    ext === '.txt' ||
    ext === '.json' ||
    ext === '.yml' ||
    ext === '.yaml' ||
    ext === '.toml' ||
    ext === '.ts' ||
    ext === '.js' ||
    ext === '.php' ||
    ext === '.py' ||
    ext === '.go' ||
    ext === '.rs' ||
    ext === '.java'
  );
}

function normalizeRelativePath(relativePath: string): string {
  if (path.sep === '/') return relativePath;
  return relativePath.split(path.sep).join('/');
}
