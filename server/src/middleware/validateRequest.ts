import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodType } from 'zod';
import type { ApiErrorDetail } from '../types/api.ts';
import { sendError } from '../utils/apiResponse.ts';

interface RequestSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

function formatZodIssues(error: ZodError): ApiErrorDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : undefined,
    message: issue.message,
  }));
}

export function validateRequest(schemas: RequestSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Request['query'];
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Request['params'];
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        sendError(res, 400, 'Request validation failed.', formatZodIssues(err));
        return;
      }
      next(err);
    }
  };
}
