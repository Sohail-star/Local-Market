import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { env } from './env.ts';
import { getPrismaClient } from './prisma.ts';
import { logger } from '../utils/logger.ts';

const execFileAsync = promisify(execFile);

function redactSecrets(text: string): string {
  return text
    .replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, '[redacted-database-url]')
    .replace(/password=[^\s;&]+/gi, 'password=[redacted]')
    .trim();
}

function getLocalMigrationNames(): string[] {
  const migrationsDir = path.resolve(process.cwd(), 'prisma', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(migrationsDir, name, 'migration.sql')))
    .sort();
}

async function runNpmOrNpxCommand(command: string, args: string[]): Promise<string> {
  const { stdout, stderr } = await execFileAsync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    timeout: 60000,
    maxBuffer: 1024 * 1024,
  });
  return redactSecrets([stdout, stderr].filter(Boolean).join('\n'));
}

export async function ensureDatabaseMigratedAndSeeded(): Promise<void> {
  if (!env.isDatabaseConfigured) {
    logger.warn('Skipping database migration/seed check: DATABASE_URL is not configured.');
    return;
  }

  if (!env.isDirectDatabaseConfigured) {
    logger.warn(
      'Skipping Prisma migrate deploy: DIRECT_URL is not configured (DIRECT_URL is required for safe Prisma migrations).'
    );
    return;
  }

  const client = getPrismaClient();
  if (!client) {
    return;
  }

  try {
    const localMigrations = getLocalMigrationNames();
    let appliedNames = new Set<string>();

    try {
      const rows = await client.$queryRaw<Array<{ migration_name: string }>>`
        SELECT migration_name
        FROM "_prisma_migrations"
        WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
      `;
      appliedNames = new Set(rows.map((r) => r.migration_name));
    } catch {
      // _prisma_migrations table does not exist yet on an uninitialized database
      appliedNames = new Set<string>();
    }

    const pendingMigrations = localMigrations.filter((name) => !appliedNames.has(name));

    if (pendingMigrations.length > 0) {
      logger.info('Applying pending Prisma migrations to PostgreSQL using DIRECT_URL...', {
        pendingCount: pendingMigrations.length,
        migrations: pendingMigrations,
      });
      const migrateOutput = await runNpmOrNpxCommand('npx', ['prisma', 'migrate', 'deploy']);
      logger.info('Prisma migrate deploy completed.', {
        output: migrateOutput.slice(0, 500),
      });
    }

    const [categoryCount, locationCount, adminRoleCount] = await Promise.all([
      client.category.count(),
      client.supportedLocation.count(),
      client.adminRole.count(),
    ]);

    if (categoryCount === 0 || locationCount === 0 || adminRoleCount === 0) {
      logger.info('Executing idempotent Prisma seed script...');
      const seedOutput = await runNpmOrNpxCommand('npm', ['run', 'prisma:seed']);
      logger.info('Prisma seed completed.', {
        output: seedOutput.slice(0, 500),
      });
    }
  } catch (err) {
    const message = err instanceof Error ? redactSecrets(err.message) : 'Unknown bootstrap error.';
    logger.error('Database migration/seed check failed during server startup.', {
      error: message,
    });
  }
}
