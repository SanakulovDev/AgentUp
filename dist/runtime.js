import fs from 'fs';
import path from 'path';
import process from 'process';
export function getArgv() {
    return process.argv.slice(2);
}
export function getCwd() {
    return process.cwd();
}
export function loadEnvFromCwd(cwd = getCwd()) {
    for (const fileName of ['.env', '.env.local']) {
        loadEnvFile(path.join(cwd, fileName));
    }
}
function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath))
        return;
    const raw = safeReadText(filePath);
    if (!raw)
        return;
    for (const rawLine of raw.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#'))
            continue;
        const normalized = line.startsWith('export ') ? line.slice(7).trim() : line;
        const eqIndex = normalized.indexOf('=');
        if (eqIndex <= 0)
            continue;
        const key = normalized.slice(0, eqIndex).trim();
        if (!isValidEnvKey(key))
            continue;
        const valueRaw = normalized.slice(eqIndex + 1).trim();
        const value = stripWrappingQuotes(valueRaw);
        if (process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}
function safeReadText(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    }
    catch {
        return '';
    }
}
function isValidEnvKey(key) {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key);
}
function stripWrappingQuotes(value) {
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
        return value.slice(1, -1);
    }
    return value;
}
