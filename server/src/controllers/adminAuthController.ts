import type { AdminRoleCode } from '@prisma/client';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  ADMIN_ACCESS_COOKIE,
  ADMIN_ACCESS_COOKIE_MAX_AGE,
  ADMIN_REFRESH_COOKIE,
  ADMIN_REFRESH_COOKIE_MAX_AGE,
  getAdminCookieOptions,
  getAdminSetupStatus,
  getAuthenticatedAdminProfile,
  loginAdmin,
  logoutAdminSession,
  refreshAdminSession,
  setupInitialSuperAdminWithToken,
} from '../services/adminAuthService.ts';
import { extractRequestAuditMeta } from '../services/auditLogService.ts';
import type { AuthenticatedRequest } from '../types/api.ts';
import { sendError, sendSuccess } from '../utils/apiResponse.ts';

const ADMIN_ROLE_VALUES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MODERATOR',
  'SUPPORT',
] as const;

export const setupSuperAdminSchema = z.object({
  setupToken: z.string().trim().min(1, 'Setup token is required.').max(256),
  fullName: z.string().trim().min(2, 'Full name is required.').max(120),
  email: z.string().trim().email('Valid email address is required.').max(160),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  password: z.string().min(12, 'Password must be at least 12 characters.').max(128),
  province: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  area: z.string().trim().max(120).optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email('Valid email address is required.'),
  password: z.string().min(1, 'Password is required.').max(128),
  preferredRole: z.enum(ADMIN_ROLE_VALUES).optional(),
});

function setAdminAuthCookies(
  req: Request,
  res: Response,
  accessToken: string,
  refreshToken: string
): void {
  const isSecure = req.secure || req.header('x-forwarded-proto') === 'https';
  res.cookie(
    ADMIN_ACCESS_COOKIE,
    accessToken,
    getAdminCookieOptions(ADMIN_ACCESS_COOKIE_MAX_AGE, isSecure)
  );
  res.cookie(
    ADMIN_REFRESH_COOKIE,
    refreshToken,
    getAdminCookieOptions(ADMIN_REFRESH_COOKIE_MAX_AGE, isSecure)
  );
}

function clearAdminAuthCookies(req: Request, res: Response): void {
  const isSecure = req.secure || req.header('x-forwarded-proto') === 'https';
  const baseOptions = {
    httpOnly: true,
    secure: isSecure,
    sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax',
    path: '/api/admin',
  };
  res.clearCookie(ADMIN_ACCESS_COOKIE, baseOptions);
  res.clearCookie(ADMIN_REFRESH_COOKIE, baseOptions);
}

export async function getSetupStatusHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = await getAdminSetupStatus();
    sendSuccess(res, 200, 'Admin setup status retrieved.', status);
  } catch (err) {
    next(err);
  }
}

export async function setupInitialSuperAdminHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await setupInitialSuperAdminWithToken(
      req.body,
      extractRequestAuditMeta(req)
    );

    setAdminAuthCookies(req, res, result.accessToken, result.refreshToken);

    sendSuccess(
      res,
      201,
      'Initial Super Admin account created and signed in. One-time setup is now permanently locked.',
      { admin: result.admin }
    );
  } catch (err) {
    next(err);
  }
}

export async function adminLoginHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password, preferredRole } = req.body as {
      email: string;
      password: string;
      preferredRole?: AdminRoleCode;
    };

    const result = await loginAdmin(
      { email, password, preferredRole },
      extractRequestAuditMeta(req)
    );

    setAdminAuthCookies(req, res, result.accessToken, result.refreshToken);

    sendSuccess(res, 200, 'Administrator signed in successfully.', {
      admin: result.admin,
    });
  } catch (err) {
    next(err);
  }
}

export async function adminRefreshHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawRefreshToken = req.cookies?.[ADMIN_REFRESH_COOKIE];
    if (typeof rawRefreshToken !== 'string' || !rawRefreshToken.trim()) {
      clearAdminAuthCookies(req, res);
      sendError(res, 401, 'Administrator refresh cookie is missing.');
      return;
    }

    const result = await refreshAdminSession(
      rawRefreshToken.trim(),
      extractRequestAuditMeta(req)
    );

    setAdminAuthCookies(req, res, result.accessToken, result.refreshToken);

    sendSuccess(res, 200, 'Administrator session refreshed.', {
      admin: result.admin,
    });
  } catch (err) {
    clearAdminAuthCookies(req, res);
    next(err);
  }
}

export async function adminLogoutHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawRefreshToken =
      typeof req.cookies?.[ADMIN_REFRESH_COOKIE] === 'string'
        ? req.cookies[ADMIN_REFRESH_COOKIE]
        : undefined;

    await logoutAdminSession({
      sessionId: req.adminAuth?.sessionId,
      rawRefreshToken,
      actorUserId: req.adminAuth?.userId,
      actorRoleCode: req.adminAuth?.activeRole,
      meta: extractRequestAuditMeta(req),
    });

    clearAdminAuthCookies(req, res);
    sendSuccess(res, 200, 'Administrator signed out.', { signedOut: true });
  } catch (err) {
    clearAdminAuthCookies(req, res);
    next(err);
  }
}

export async function getAdminMeHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.adminAuth) {
      sendError(res, 401, 'Administrator authentication required.');
      return;
    }

    const admin = await getAuthenticatedAdminProfile(
      req.adminAuth.userId,
      req.adminAuth.activeRole
    );

    sendSuccess(res, 200, 'Authenticated administrator profile retrieved.', {
      admin,
    });
  } catch (err) {
    next(err);
  }
}
