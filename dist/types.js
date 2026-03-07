export const ALL_LANGUAGES = [
    'typescript',
    'javascript',
    'php',
    'python',
    'go',
    'rust',
    'java',
];
export const ALL_DATABASES = [
    'postgresql',
    'mysql',
    'mariadb',
    'mongodb',
    'sqlite',
    'redis',
    'ms-sql',
    'oracle',
    'none',
];
export const FRAMEWORKS_BY_LANGUAGE = {
    typescript: ['Node.js', 'React', 'Next.js', 'NestJS', 'Express', 'Vue'],
    javascript: ['Node.js', 'React', 'Next.js', 'Express', 'Vue'],
    php: ['Yii2', 'Laravel', 'Symfony', 'CodeIgniter', 'Native PHP'],
    python: ['Django', 'FastAPI', 'Flask', 'Pytest-only'],
    go: ['Gin', 'Fiber', 'Echo', 'Standard Library'],
    rust: ['Axum', 'Actix Web', 'Rocket', 'CLI'],
    java: ['Spring Boot', 'Quarkus', 'Micronaut', 'Plain Java'],
};
export const LANGUAGE_VERSION_PLACEHOLDERS = {
    typescript: '5.8',
    javascript: 'ES2023 / Node 22',
    php: '8.3',
    python: '3.12',
    go: '1.24',
    rust: '1.86',
    java: '21',
};
export const DATABASE_VERSION_PLACEHOLDERS = {
    postgresql: '17',
    mysql: '8.4',
    mariadb: '11.4',
    mongodb: '8.0',
    sqlite: '3',
    redis: '7.4',
    'ms-sql': '2022',
    oracle: '23ai',
    none: '-',
};
