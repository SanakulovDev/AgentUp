import process from 'process';

export function getArgv(): string[] {
  return process.argv.slice(2);
}

export function getCwd(): string {
  return process.cwd();
}