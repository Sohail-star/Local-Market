import type { AdminRoleCode } from '@prisma/client';
import type { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import { getPrismaClient } from '../config/prisma.ts';
import {
  ADMIN_ACCESS_COOKIE,
  type AdminAccessJwtPayload,
} from '../services/adminAuthService.ts';
import type { AuthenticatedRequest } from '../types/api.ts';
import { sendError } from '../utils/apiResponse.ts';

function extractAdminAccessToken(req: AuthenticatedRequest): string | null {
  const cookieToken = req.cookies?.[ADMIN_ACCESS_COOKIE];
  if (typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
    return cookieToken.trim();
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer.length > 0) {
      return bearer;
    }
  }

  return null;
}

/**
 * Server-side fail-closed admin authentication middleware.
 * Verifies signed admin-audience JWT, active AdminSession record in PostgreSQL,
 * active User status, and live UserAdminRole assignments from the database.
 */
export async function requireAdminAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!env.isAdminAuthConfigured) {
    sendError(
      res,
      503,
      'Admin authentication secrets are not configured in the server environment.'
    );
    return;
  }

  const token = extractAdminAccessToken(req);
  if (!token) {
    sendError(res, 401, 'Administrator authentication required.');
    return;
  }

  let decoded: AdminAccessJwtPayload;
  try {
    decoded = jwt.verify(token, env.adminAccessSecret, {
      audience: 'localmarket-admin',
      issuer: 'localmarket-api',
    }) as AdminAccessJwtPayload;
  } catch {
    sendError(res, 401, 'Invalid or expired administrator session.');
    return;
  }

  if (decoded.typ !== 'admin-access' || !decoded.sub || !decoded.sid) {
    sendError(res, 401, 'Invalid administrator token payload.');
    return;
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, 503, 'Database unavailable.');
    return;
  }

  try {
    const session = await prisma.adminSession.findUnique({
      where: { id: decoded.sid },
      include: {
        user: {
          include: {
            adminRoleAssignments: {
              where: { isActive: true, revokedAt: null },
              include: { role: true },
            },
          },
        },
      },
    });

    if (
      !session ||
      session.userId !== decoded.sub ||
      session.revokedAt !== null ||
      session.expiresAt <= new Date()
    ) {
      sendError(res, 401, 'Administrator session has expired or been revoked.');
      return;
    }

    if (session.user.accountStatus !== 'ACTIVE') {
      sendError(res, 403, 'Administrator account is suspended or inactive.');
      return;
    }

    const dbRoles = session.user.adminRoleAssignments.map((a) => a.role.code);
    if (dbRoles.length === 0) {
      sendError(res, 403, 'No active administrator roles assigned to this account.');
      return;
    }

    const permissions = Array.from(
      new Set(session.user.adminRoleAssignments.flatMap((a) => a.role.permissions))
    );

    const activeRole = dbRoles.includes(session.activeRoleCode)
      ? session.activeRoleCode
      : dbRoles[0];

    req.adminAuth = {
      userId: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      sessionId: session.id,
      activeRole,
      roles: dbRoles,
      permissions,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Role-based authorization middleware backed strictly by PostgreSQL UserAdminRole records.
 */
export function requireAdminRoles(...allowedRoles: AdminRoleCode[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.adminAuth) {
      sendError(res, 401, 'Administrator authentication required.');
      return;
    }

    const hasAllowedRole = req.adminAuth.roles.some((role) => allowedRoles.includes(role));
    if (!hasAllowedRole) {
      sendError(
        res,
        403,
        `Access denied. Required administrator role: ${allowedRoles.join(' or ')}.`
      );
      return;
    }

    next();
  };
}
