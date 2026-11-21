import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.ts';
import { apiNotFoundHandler, errorHandler } from './middleware/errorHandler.ts';
import { apiRouter } from './routes/index.ts';
import { sendError } from './utils/apiResponse.ts';
import { httpRequestLogger } from './utils/logger.ts';

export function createApiApp(): Express {
  const app = express();

  app.set('trust proxy', 1);

  // Security headers compatible with AI Studio iframe embedding, cross-origin Vite assets, and module scripts
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      frameguard: false,
    })
  );

  // Scope CORS strictly to /api routes so frontend HTML, Vite dev modules, and production
  // static assets (loaded with `crossorigin` by Vite) are never blocked by Origin checks.
  const apiCors = cors((req, callback) => {
    const rawOrigin = req.headers.origin;
    const origin = Array.isArray(rawOrigin) ? rawOrigin[0] : rawOrigin;
    if (!origin) {
      callback(null, { origin: false });
      return;
    }

    if (env.allowedOrigins.includes(origin)) {
      callback(null, { origin: true, credentials: true });
      return;
    }

    // Allow genuine same-origin requests from custom/shared deployment hosts (e.g. localmarket-1.ai.studio)
    const rawForwardedHost = req.headers['x-forwarded-host'];
    const forwardedHost = (
      Array.isArray(rawForwardedHost) ? rawForwardedHost[0] : rawForwardedHost
    )
      ?.split(',')[0]
      ?.trim();
    const rawHost = req.headers.host;
    const requestHost = forwardedHost || (Array.isArray(rawHost) ? rawHost[0] : rawHost);
    try {
      const originUrl = new URL(origin);
      if (requestHost && originUrl.host === requestHost) {
        callback(null, { origin: true, credentials: true });
        return;
      }
    } catch {
      // Ignore malformed Origin header
    }

    // Disallow untrusted cross-origin API requests cleanly without throwing HTTP 500
    callback(null, { origin: false });
  });

  // Rate limiting scoped to /api routes (generous enough for polling inbox/chat safely)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1200,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(_req, res) {
      sendError(res, 429, 'Too many requests. Please slow down and try again shortly.');
    },
  });

  app.use(express.json({ limit: '8mb' }));
  app.use(express.urlencoded({ extended: true, limit: '8mb' }));
  app.use(cookieParser());
  app.use(httpRequestLogger);

  app.use(['/api/admin', '/api/auth', '/api/chat'], (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    next();
  });

  app.use('/api', apiCors, apiLimiter, apiRouter);
  app.use('/api', apiNotFoundHandler);
  app.use('/api', errorHandler);

  return app;
}
