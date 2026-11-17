import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.ts';
import { AppError, sendError } from '../utils/apiResponse.ts';
import { logger } from '../utils/logger.ts';

export function apiNotFoundHandler(req: Request, res: Response): void {
  sendError(res, 404, `API endpoint not found: ${req.method} ${req.originalUrl}`);
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message, err.errors);
    return;
  }

  const isSyntaxError =
    err instanceof SyntaxError &&
    'status' in err &&
    typeof err.status === 'number' &&
    err.status === 400;

  if (isSyntaxError) {
    sendError(res, 400, 'Malformed JSON request payload.');
    return;
  }

  const safeMessage =
    !env.isProduction && err instanceof Error
      ? err.message
      : 'An unexpected internal server error occurred.';

  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, {
    error: err instanceof Error ? err.message : String(err),
  });

  sendError(res, 500, safeMessage);
}
