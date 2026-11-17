import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { env } from './env.ts';

declare global {
  var __localmarketPgPool: pg.Pool | undefined;
  var __localmarketPrisma: PrismaClient | undefined;
}

function sanitizeDatabaseError(err: unknown): string {
  const raw = err instanceof Error ? err.message : 'Unable to connect to PostgreSQL database.';
  // Strip any embedded connection URI or password segments so secrets can never leak
  const scrubbed = raw
    .replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, '[redacted-database-url]')
    .replace(/password=[^\s;&]+/gi, 'password=[redacted]')
    .trim();

  if (!scrubbed) {
    return 'PostgreSQL connection check failed.';
  }
  if (scrubbed.includes('ETIMEDOUT') || scrubbed.includes('timeout')) {
    return 'Database connection timed out while reaching PostgreSQL.';
  }
  if (scrubbed.includes('ENOTFOUND') || scrubbed.includes('EAI_AGAIN')) {
    return 'Database host could not be resolved.';
  }
  if (scrubbed.includes('password authentication failed') || scrubbed.includes('28P01')) {
    return 'Database authentication failed. Check configured credentials.';
  }
  return scrubbed.slice(0, 200);
}

export function getPrismaClient(): PrismaClient | null {
  if (!env.isDatabaseConfigured) {
    return null;
  }

  if (!globalThis.__localmarketPrisma) {
    const pool =
      globalThis.__localmarketPgPool ??
      new pg.Pool({
        connectionString: env.DATABASE_URL,
        max: 10,
        connectionTimeoutMillis: 10000,
      });

    pool.on('error', (err) => {
      console.error('[pg-pool] Idle database client error:', sanitizeDatabaseError(err));
    });

    globalThis.__localmarketPgPool = pool;
    const adapter = new PrismaPg(pool);
    globalThis.__localmarketPrisma = new PrismaClient({ adapter });
  }

  return globalThis.__localmarketPrisma;
}

export interface DatabaseHealthStatus {
  configured: boolean;
  directUrlConfigured: boolean;
  status: 'connected' | 'disconnected';
  latencyMs?: number;
  schema?: {
    publicTableCount: number;
    publicTables: string[];
    appliedMigrations: string[];
    counts: {
      categoriesTotal: number;
      productCategories: number;
      serviceCategories: number;
      supportedLocations: number;
      adminRoles: number;
      users: number;
    };
  };
  error?: string;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  const client = getPrismaClient();
  if (!client) {
    return {
      configured: false,
      directUrlConfigured: env.isDirectDatabaseConfigured,
      status: 'disconnected',
      error: 'DATABASE_URL secret is not configured in the environment.',
    };
  }

  const startedAt = Date.now();
  try {
    await client.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startedAt;

    const tableRows = await client.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `;
    const publicTables = tableRows.map((row) => row.table_name);

    let appliedMigrations: string[] = [];
    try {
      const migRows = await client.$queryRaw<Array<{ migration_name: string }>>`
        SELECT migration_name
        FROM "_prisma_migrations"
        WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
        ORDER BY finished_at ASC
      `;
      appliedMigrations = migRows.map((row) => row.migration_name);
    } catch {
      appliedMigrations = [];
    }

    let productCategories = 0;
    let serviceCategories = 0;
    let supportedLocations = 0;
    let adminRoles = 0;
    let users = 0;

    if (publicTables.includes('categories')) {
      [productCategories, serviceCategories] = await Promise.all([
        client.category.count({ where: { type: 'PRODUCT' } }),
        client.category.count({ where: { type: 'SERVICE' } }),
      ]);
    }
    if (publicTables.includes('supported_locations')) {
      supportedLocations = await client.supportedLocation.count();
    }
    if (publicTables.includes('admin_roles')) {
      adminRoles = await client.adminRole.count();
    }
    if (publicTables.includes('users')) {
      users = await client.user.count();
    }

    return {
      configured: true,
      directUrlConfigured: env.isDirectDatabaseConfigured,
      status: 'connected',
      latencyMs,
      schema: {
        publicTableCount: publicTables.length,
        publicTables,
        appliedMigrations,
        counts: {
          categoriesTotal: productCategories + serviceCategories,
          productCategories,
          serviceCategories,
          supportedLocations,
          adminRoles,
          users,
        },
      },
    };
  } catch (err) {
    return {
      configured: true,
      directUrlConfigured: env.isDirectDatabaseConfigured,
      status: 'disconnected',
      error: sanitizeDatabaseError(err),
    };
  }
}

export async function disconnectPrisma(): Promise<void> {
  if (globalThis.__localmarketPrisma) {
    await globalThis.__localmarketPrisma.$disconnect();
    globalThis.__localmarketPrisma = undefined;
  }
  if (globalThis.__localmarketPgPool) {
    await globalThis.__localmarketPgPool.end();
    globalThis.__localmarketPgPool = undefined;
  }
}
