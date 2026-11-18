import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { env } from './server/src/config/env.ts';
import { logger } from './server/src/utils/logger.ts';

function ensurePrismaClientGenerated(): void {
  const generatedClientEntry = path.resolve(
    process.cwd(),
    'node_modules',
    '.prisma',
    'client',
    'index.js'
  );

  if (!fs.existsSync(generatedClientEntry)) {
    logger.info('Prisma Client artifacts missing. Running prisma generate...');
    execFileSync('npx', ['prisma', 'generate'], {
      cwd: process.cwd(),
      stdio: 'inherit',
    });
  }
}

async function startServer() {
  ensurePrismaClientGenerated();

  const [{ createApiApp }, { disconnectPrisma }, { ensureDatabaseMigratedAndSeeded }] =
    await Promise.all([
      import('./server/src/app.ts'),
      import('./server/src/config/prisma.ts'),
      import('./server/src/config/dbBootstrap.ts'),
    ]);

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
      app.use(
        express.static(distDir, {
          setHeaders(res, filePath) {
            if (filePath.endsWith('.html')) {
              res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
              res.setHeader('Pragma', 'no-cache');
            } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            }
          },
        })
      );
    }
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      if (path.extname(req.path) !== '') {
        res.status(404).send('Asset not found.');
        return;
      }
      if (fs.existsSync(indexHtml)) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.sendFile(indexHtml);
        return;
      }
      res.status(404).send('Production build not found. Run npm run build first.');
    });
  }

  const server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`LocalMarket server listening on http://0.0.0.0:${env.PORT} (${env.NODE_ENV})`);
    void ensureDatabaseMigratedAndSeeded();
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
