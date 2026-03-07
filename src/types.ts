export type Provider = 'claude' | 'codex' | 'gemini' | 'cursor' | 'antigravity';
export type IDE = 'cursor' | 'vscode' | 'phpstorm' | 'zed' | 'jetbrains';
export type AgentRole = 'plan' | 'review' | 'test' | 'code';
export type DetectionMode = 'manual' | 'auto';
export type OverwriteMode = 'skip' | 'replace';
export type RepoType = 'node' | 'php' | 'python' | 'go' | 'rust' | 'java' | 'unknown';

export type Language = 'typescript' | 'javascript' | 'php' | 'python' | 'go' | 'rust' | 'java';

export type Database =
  | 'postgresql'
  | 'mysql'
  | 'mariadb'
  | 'mongodb'
  | 'sqlite'
  | 'redis'
  | 'ms-sql'
  | 'oracle'
  | 'none';

export type ProjectInfo = {
  name: string;
  description: string;
  language?: Language;
  languageVersion?: string;
  framework?: string;
  dockerEnabled?: boolean;
  database?: Database;
  databaseVersion?: string;
  stack: string[];
  packageManager?: string;
  testCommand?: string;
  lintCommand?: string;
  buildCommand?: string;
  devCommand?: string;
  repoType: RepoType;
};

export type InitAnswers = {
  projectRoot: string;
  providers: Provider[];
  ide: IDE;
  detectionMode: DetectionMode;
  roles: AgentRole[];
  overwriteMode: OverwriteMode;
  projectInfo: ProjectInfo;
  createClaudeDir: boolean;
  createCursorDir: boolean;
};

export type TemplateContext = {
  name: string;
  description: string;
  language?: Language;
  languageVersion?: string;
  framework?: string;
  dockerEnabled?: boolean;
  database?: Database;
  databaseVersion?: string;
  stack: string[];
  packageManager: string;
  ide: IDE;
  providers: Provider[];
  roles: AgentRole[];
  commands: {
    dev?: string;
    build?: string;
    test?: string;
    lint?: string;
  };
};

export const ALL_LANGUAGES: Language[] = [
  'typescript',
  'javascript',
  'php',
  'python',
  'go',
  'rust',
  'java',
];

export const ALL_DATABASES: Database[] = [
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

export const FRAMEWORKS_BY_LANGUAGE: Record<Language, string[]> = {
  typescript: ['Node.js', 'React', 'Next.js', 'NestJS', 'Express', 'Vue'],
  javascript: ['Node.js', 'React', 'Next.js', 'Express', 'Vue'],
  php: ['Yii2', 'Laravel', 'Symfony', 'CodeIgniter', 'Native PHP'],
  python: ['Django', 'FastAPI', 'Flask', 'Pytest-only'],
  go: ['Gin', 'Fiber', 'Echo', 'Standard Library'],
  rust: ['Axum', 'Actix Web', 'Rocket', 'CLI'],
  java: ['Spring Boot', 'Quarkus', 'Micronaut', 'Plain Java'],
};

export const LANGUAGE_VERSION_PLACEHOLDERS: Record<Language, string> = {
  typescript: '5.8',
  javascript: 'ES2023 / Node 22',
  php: '8.3',
  python: '3.12',
  go: '1.24',
  rust: '1.86',
  java: '21',
};

export const DATABASE_VERSION_PLACEHOLDERS: Record<Database, string> = {
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