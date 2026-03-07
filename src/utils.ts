export function splitCsv(value: string): string[] {
    return unique(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    );
  }
  
  export function unique<T>(items: T[]): T[] {
    return [...new Set(items)];
  }
  
  export function normalizeOptional(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  
  export function asString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
  }
  
  export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
  
  export function assert(condition: unknown, message: string): void {
    if (!condition) {
      throw new Error(`Self-test failed: ${message}`);
    }
  }