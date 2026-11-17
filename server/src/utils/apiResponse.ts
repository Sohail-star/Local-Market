import type { Response } from 'express';
import type { ApiErrorDetail, ApiErrorResponse, ApiSuccessResponse } from '../types/api.ts';

export class AppError extends Error {
  readonly statusCode: number;
  readonly errors: ApiErrorDetail[];

  constructor(statusCode: number, message: string, errors: ApiErrorDetail[] = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T,
  meta?: Record<string, unknown>
): Response {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  errors: ApiErrorDetail[] = []
): Response {
  const payload: ApiErrorResponse = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(payload);
}
