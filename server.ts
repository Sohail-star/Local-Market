import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { env } from './server/src/config/env.ts';
import { ensureDatabaseMigratedAndSeeded } from './server/src/config/dbBootstrap.ts';
import { disconnectPrisma } from './server/src/config/prisma.ts';
import { createApiApp } from './server/src/app.ts';
import { logger } from './server/src/utils/logger.ts';

async function startServer() {
  await ensureDatabaseMigratedAndSeeded();

  const app = createApiApp();

  if (!env.isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    const indexHtml = path.join(distDir, 'index.html');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
    }
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
        return;
      }
      res.status(404).send('Production build not found. Run npm run build first.');
    });
  }

  const server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`LocalMarket server listening on http://0.0.0.0:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Closing HTTP server and database pool...`);
    server.close(async () => {
      await disconnectPrisma();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

startServer().catch((err) => {
  logger.error('Fatal error starting LocalMarket server', {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
