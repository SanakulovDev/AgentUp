import process from 'process';
export function getArgv() {
    return process.argv.slice(2);
}
export function getCwd() {
    return process.cwd();
}
