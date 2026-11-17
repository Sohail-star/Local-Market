import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { env } from './env.ts';

declare global {
  var __localmarketPgPool: pg.Pool | undefined;
  var __localmarketPrisma: PrismaClient | undefined;
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
        connectionTimeoutMillis: 5000,
      });

    pool.on('error', (err) => {
      console.error('[pg-pool] Idle database client error:', err.message);
    });

    globalThis.__localmarketPgPool = pool;
    const adapter = new PrismaPg(pool);
    globalThis.__localmarketPrisma = new PrismaClient({ adapter });
  }

  return globalThis.__localmarketPrisma;
}

export interface DatabaseHealthStatus {
  configured: boolean;
  status: 'connected' | 'not_configured' | 'unreachable';
  latencyMs?: number;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  const client = getPrismaClient();
  if (!client) {
    return {
      configured: false,
      status: 'not_configured',
    };
  }

  const startedAt = Date.now();
  try {
    await client.$queryRaw`SELECT 1`;
    return {
      configured: true,
      status: 'connected',
      latencyMs: Date.now() - startedAt,
    };
  } catch {
    return {
      configured: true,
      status: 'unreachable',
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
