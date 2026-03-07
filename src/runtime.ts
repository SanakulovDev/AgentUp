import fs from 'fs';
import path from 'path';
import process from 'process';

export function getArgv(): string[] {
  return process.argv.slice(2);
}

export function getCwd(): string {
  return process.cwd();
}

export function loadEnvFromCwd(cwd = getCwd()): void {
  for (const fileName of ['.env', '.env.local']) {
    loadEnvFile(path.join(cwd, fileName));
  }
}

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const raw = safeReadText(filePath);
  if (!raw) return;

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const normalized = line.startsWith('export ') ? line.slice(7).trim() : line;
    const eqIndex = normalized.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = normalized.slice(0, eqIndex).trim();
    if (!isValidEnvKey(key)) continue;

    const valueRaw = normalized.slice(eqIndex + 1).trim();
    const value = stripWrappingQuotes(valueRaw);
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function safeReadText(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function isValidEnvKey(key: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key);
}

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}
