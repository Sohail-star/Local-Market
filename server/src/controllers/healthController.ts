import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.ts';
import { checkDatabaseHealth } from '../config/prisma.ts';
import { sendSuccess } from '../utils/apiResponse.ts';

export async function getHealthStatus(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const database = await checkDatabaseHealth();
    const isDegraded = database.configured && database.status === 'unreachable';

    sendSuccess(
      res,
      isDegraded ? 503 : 200,
      isDegraded
        ? 'LocalMarket API running, but PostgreSQL database is unreachable.'
        : 'LocalMarket API is healthy.',
      {
        service: 'localmarket-api',
        environment: env.NODE_ENV,
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
        database,
        integrations: {
          authSecretsConfigured: env.isAuthConfigured,
          cloudinaryConfigured: env.isCloudinaryConfigured,
        },
      }
    );
  } catch (err) {
    next(err);
  }
}
