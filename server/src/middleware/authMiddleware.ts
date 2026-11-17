import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest, CapabilityKey } from '../types/api.ts';
import { sendError } from '../utils/apiResponse.ts';

/**
 * Fail-closed authentication middleware placeholder for Milestone 1.
 * Milestone 3 will verify HTTP-only JWT/session cookies against PostgreSQL sessions.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.auth) {
    sendError(res, 401, 'Authentication required.');
    return;
  }
  next();
}

export function requireCapability(capability: CapabilityKey) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      sendError(res, 401, 'Authentication required.');
      return;
    }
    if (!req.auth.capabilities[capability]) {
      sendError(
        res,
        403,
        `Account capability "${capability}" must be enabled to perform this action.`
      );
      return;
    }
    next();
  };
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.auth) {
    sendError(res, 401, 'Authentication required.');
    return;
  }
  if (!req.auth.isAdmin) {
    sendError(res, 403, 'Administrator privileges required.');
    return;
  }
  next();
}
