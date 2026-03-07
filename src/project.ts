import fs from 'fs';
import path from 'path';
import type { Database, Language, ProjectInfo } from './types.js';
import { asString, isRecord, unique } from './utils.js';

export function emptyProjectInfo(name: string): ProjectInfo {
  return {
    name,
    description: '',
    dockerEnabled: false,
    database: 'none',
    databaseVersion: '',
    stack: [],
    repoType: 'unknown',
  };
}

export function detectProjectInfo(projectRoot: string): ProjectInfo {
  const info = emptyProjectInfo(path.basename(projectRoot));

  const packageJsonPath = path.join(projectRoot, 'package.json');
  const composerJsonPath = path.join(projectRoot, 'composer.json');
  const pyProjectPath = path.join(projectRoot, 'pyproject.toml');
  const goModPath = path.join(projectRoot, 'go.mod');
  const cargoTomlPath = path.join(projectRoot, 'Cargo.toml');
  const pomXmlPath = path.join(projectRoot, 'pom.xml');
  const buildGradlePath = path.join(projectRoot, 'build.gradle');
  const readmePath = findFirstExisting(projectRoot, ['README.md', 'readme.md']);

  if (fs.existsSync(packageJsonPath)) {
    const pkg = safeReadJson(packageJsonPath) as Record<string, unknown>;
    const scripts = isRecord(pkg.scripts) ? pkg.scripts : {};

    info.repoType = 'node';
    info.language = hasDependency(pkg, 'typescript') ? 'typescript' : 'javascript';
    info.languageVersion ??= info.language === 'typescript' ? '5.8' : 'ES2023 / Node 22';
    info.name = asString(pkg.name) || info.name;
    info.description = asString(pkg.description) || info.description;
    info.packageManager = detectPackageManager(projectRoot, asString(pkg.packageManager));
    info.stack.push('Node.js');

    if (hasDependency(pkg, 'typescript')) info.stack.push('TypeScript');
    if (hasDependency(pkg, 'react')) {
      info.stack.push('React');
      info.framework ??= 'React';
    }
    if (hasDependency(pkg, 'next')) {
      info.stack.push('Next.js');
      info.framework = 'Next.js';
    }
    if (hasDependency(pkg, 'vue')) {
      info.stack.push('Vue');
      info.framework ??= 'Vue';
    }
    if (hasDependency(pkg, '@nestjs/core') || hasDependency(pkg, 'nestjs')) {
      info.stack.push('NestJS');
      info.framework = 'NestJS';
    }
    if (hasDependency(pkg, 'express')) {
      info.stack.push('Express');
      info.framework ??= 'Express';
    }
    if (!info.framework) {
      info.framework = 'Node.js';
    }

    info.devCommand = scriptCommand(info.packageManager, 'dev', asString(scripts.dev));
    info.buildCommand = scriptCommand(info.packageManager, 'build', asString(scripts.build));
    info.testCommand = scriptCommand(info.packageManager, 'test', asString(scripts.test));
    info.lintCommand = scriptCommand(info.packageManager, 'lint', asString(scripts.lint));
  }

  if (fs.existsSync(composerJsonPath)) {
    const composer = safeReadJson(composerJsonPath) as Record<string, unknown>;
    info.repoType = 'php';
    info.language = 'php';
    info.languageVersion ??= '8.3';

    const composerName = asString(composer.name);
    if (!info.name && composerName) {
      info.name = composerName.split('/')[1] || composerName;
    }
    if (!info.description) {
      info.description = asString(composer.description) || info.description;
    }

    info.stack.push('PHP');
    if (hasComposerDependency(composer, 'yiisoft/yii2')) {
      info.stack.push('Yii2');
      info.framework = 'Yii2';
    }
    if (hasComposerDependency(composer, 'laravel/framework')) {
      info.stack.push('Laravel');
      info.framework = 'Laravel';
    }
    if (hasComposerDependency(composer, 'symfony/framework-bundle')) {
      info.stack.push('Symfony');
      info.framework = 'Symfony';
    }
    info.framework ??= 'Native PHP';

    info.testCommand ??= 'vendor/bin/phpunit';
    info.lintCommand ??= 'vendor/bin/php-cs-fixer fix --dry-run';
  }

  if (fs.existsSync(pyProjectPath)) {
    info.repoType = 'python';
    info.language = 'python';
    info.languageVersion ??= '3.12';
    info.stack.push('Python');

    const raw = safeReadText(pyProjectPath).toLowerCase();
    if (raw.includes('django')) {
      info.stack.push('Django');
      info.framework = 'Django';
    }
    if (raw.includes('fastapi')) {
      info.stack.push('FastAPI');
      info.framework = 'FastAPI';
    }
    if (raw.includes('flask')) {
      info.stack.push('Flask');
      info.framework ??= 'Flask';
    }
    info.framework ??= 'Pytest-only';

    info.testCommand ??= 'pytest';
    info.lintCommand ??= 'ruff check .';
  }

  if (fs.existsSync(goModPath)) {
    info.repoType = 'go';
    info.language = 'go';
    info.languageVersion ??= '1.24';
    info.stack.push('Go');
    info.framework ??= detectGoFramework(goModPath) ?? 'Standard Library';
    info.testCommand ??= 'go test ./...';
  }

  if (fs.existsSync(cargoTomlPath)) {
    info.repoType = 'rust';
    info.language = 'rust';
    info.languageVersion ??= '1.86';
    info.stack.push('Rust');
    info.framework ??= detectRustFramework(cargoTomlPath) ?? 'CLI';
    info.testCommand ??= 'cargo test';
    info.buildCommand ??= 'cargo build';
  }

  if (fs.existsSync(pomXmlPath) || fs.existsSync(buildGradlePath)) {
    info.repoType = 'java';
    info.language = 'java';
    info.languageVersion ??= '21';
    info.stack.push('Java');

    const javaText = [
      fs.existsSync(pomXmlPath) ? safeReadText(pomXmlPath) : '',
      fs.existsSync(buildGradlePath) ? safeReadText(buildGradlePath) : '',
    ]
      .join('\n')
      .toLowerCase();

    if (javaText.includes('spring-boot')) info.framework = 'Spring Boot';
    else if (javaText.includes('quarkus')) info.framework = 'Quarkus';
    else if (javaText.includes('micronaut')) info.framework = 'Micronaut';
    else info.framework = 'Plain Java';

    info.buildCommand ??= fs.existsSync(pomXmlPath) ? 'mvn package' : 'gradle build';
    info.testCommand ??= fs.existsSync(pomXmlPath) ? 'mvn test' : 'gradle test';
  }

  detectDockerAndDatabase(projectRoot, info);

  if (readmePath && !info.description) {
    info.description = inferDescriptionFromReadme(readmePath) || info.description;
  }

  info.stack = unique(info.stack).filter(Boolean);
  return info;
}

function detectDockerAndDatabase(projectRoot: string, info: ProjectInfo): void {
  const dockerCandidates = ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', '.dockerignore'];
  info.dockerEnabled = dockerCandidates.some((file) => fs.existsSync(path.join(projectRoot, file)));

  const candidateFiles = [
    'package.json',
    'composer.json',
    'pyproject.toml',
    'go.mod',
    'Cargo.toml',
    'pom.xml',
    'build.gradle',
    'docker-compose.yml',
    'docker-compose.yaml',
    '.env',
    '.env.example',
  ];

  const combinedText = candidateFiles
    .map((file) => path.join(projectRoot, file))
    .filter((filePath) => fs.existsSync(filePath))
    .map((filePath) => safeReadText(filePath).toLowerCase())
    .join('\n');

  let database: Database = 'none';
  let version = '';

  if (combinedText.includes('postgres')) {
    database = 'postgresql';
    version = '17';
  } else if (combinedText.includes('mariadb')) {
    database = 'mariadb';
    version = '11.4';
  } else if (combinedText.includes('mysql')) {
    database = 'mysql';
    version = '8.4';
  } else if (combinedText.includes('mongodb') || combinedText.includes('mongoose')) {
    database = 'mongodb';
    version = '8.0';
  } else if (combinedText.includes('sqlite')) {
    database = 'sqlite';
    version = '3';
  } else if (combinedText.includes('redis')) {
    database = 'redis';
    version = '7.4';
  } else if (combinedText.includes('sqlserver') || combinedText.includes('mssql')) {
    database = 'ms-sql';
    version = '2022';
  } else if (combinedText.includes('oracle')) {
    database = 'oracle';
    version = '23ai';
  }

  info.database = database;
  info.databaseVersion = database === 'none' ? '' : version;
}

function detectGoFramework(goModPath: string): string | undefined {
  const text = safeReadText(goModPath).toLowerCase();
  if (text.includes('github.com/gin-gonic/gin')) return 'Gin';
  if (text.includes('github.com/gofiber/fiber')) return 'Fiber';
  if (text.includes('github.com/labstack/echo')) return 'Echo';
  return undefined;
}

function detectRustFramework(cargoTomlPath: string): string | undefined {
  const text = safeReadText(cargoTomlPath).toLowerCase();
  if (text.includes('axum')) return 'Axum';
  if (text.includes('actix-web')) return 'Actix Web';
  if (text.includes('rocket')) return 'Rocket';
  return undefined;
}

export function detectPackageManager(projectRoot: string, declared?: string): string {
  if (declared) return declared.split('@')[0];
  if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(projectRoot, 'bun.lockb')) || fs.existsSync(path.join(projectRoot, 'bun.lock'))) {
    return 'bun';
  }
  return 'npm';
}

export function scriptCommand(
  packageManager: string | undefined,
  scriptName: string,
  scriptValue?: string,
): string | undefined {
  if (!scriptValue) return undefined;
  const pm = packageManager ?? 'npm';

  switch (pm) {
    case 'pnpm':
    case 'bun':
      return `${pm} ${scriptName}`;
    case 'yarn':
      return `yarn ${scriptName}`;
    default:
      return scriptName === 'test' ? 'npm test' : `npm run ${scriptName}`;
  }
}

export function findFirstExisting(root: string, names: string[]): string | undefined {
  for (const name of names) {
    const fullPath = path.join(root, name);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  return undefined;
}

export function safeReadJson(filePath: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

export function safeReadText(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

export function inferDescriptionFromReadme(readmePath: string): string {
  const raw = safeReadText(readmePath);
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const firstNonHeading = lines.find((line) => !line.startsWith('#'));
  return firstNonHeading ?? '';
}

export function hasDependency(pkg: Record<string, unknown>, dep: string): boolean {
  const dependencies = isRecord(pkg.dependencies) ? pkg.dependencies : {};
  const devDependencies = isRecord(pkg.devDependencies) ? pkg.devDependencies : {};
  return dep in dependencies || dep in devDependencies;
}

export function hasComposerDependency(pkg: Record<string, unknown>, dep: string): boolean {
  const requireDeps = isRecord(pkg.require) ? pkg.require : {};
  const requireDevDeps = isRecord(pkg['require-dev']) ? pkg['require-dev'] : {};
  return dep in requireDeps || dep in requireDevDeps;
}