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

  // Security headers compatible with AI Studio preview iframe and Vite module scripts
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      frameguard: false,
    })
  );

  // Explicit frontend origin allowlist with credentialed cookie support
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (env.allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin not allowed by CORS policy: ${origin}`));
      },
      credentials: true,
    })
  );

  // Rate limiting scoped to /api routes
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(_req, res) {
      sendError(res, 429, 'Too many requests. Please slow down and try again shortly.');
    },
  });

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());
  app.use(httpRequestLogger);

  app.use('/api', apiLimiter, apiRouter);
  app.use('/api', apiNotFoundHandler);
  app.use(errorHandler);

  return app;
}
