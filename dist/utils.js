export function splitCsv(value) {
    return unique(value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean));
}
export function unique(items) {
    return [...new Set(items)];
}
export function normalizeOptional(value) {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
}
export function asString(value) {
    return typeof value === 'string' && value.trim() ? value : undefined;
}
export function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function assert(condition, message) {
    if (!condition) {
        throw new Error(`Self-test failed: ${message}`);
    }
}
