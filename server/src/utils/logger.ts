import type { NextFunction, Request, Response } from 'express';

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      console.log(`[LocalMarket][INFO] ${message}`, meta);
    } else {
      console.log(`[LocalMarket][INFO] ${message}`);
    }
  },
  warn(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      console.warn(`[LocalMarket][WARN] ${message}`, meta);
    } else {
      console.warn(`[LocalMarket][WARN] ${message}`);
    }
  },
  error(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      console.error(`[LocalMarket][ERROR] ${message}`, meta);
    } else {
      console.error(`[LocalMarket][ERROR] ${message}`);
    }
  },
};

export function httpRequestLogger(req: Request, res: Response, next: NextFunction): void {
  if (!req.path.startsWith('/api')) {
    next();
    return;
  }
  const startedAt = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    logger.info(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
  });
  next();
}
