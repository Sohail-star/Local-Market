import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import {
  USER_ACCESS_COOKIE,
  USER_ACCESS_COOKIE_MAX_AGE,
  USER_REFRESH_COOKIE,
  USER_REFRESH_COOKIE_MAX_AGE,
  getUserCookieOptions,
  getUserProfileById,
  loginDemoMarketplaceUser,
  loginUser,
  refreshUserSession,
  registerUser,
} from '../services/userAuthService.ts';
import type { AuthenticatedRequest } from '../types/api.ts';
import { sendError, sendSuccess } from '../utils/apiResponse.ts';

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required.').max(120),
  email: z.string().trim().email('Valid email address is required.').max(160),
  phone: z.string().trim().max(24).optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(128),
  province: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  area: z.string().trim().max(120).optional(),
  avatarUrl: z.string().max(3_000_000).optional(),
  capabilities: z
    .object({
      buy: z.boolean().optional(),
      sell: z.boolean().optional(),
      offerServices: z.boolean().optional(),
      hireProviders: z.boolean().optional(),
    })
    .optional(),
});

const loginSchema = z.object({
  identifier: z.string().trim().min(2, 'Email or phone number is required.').max(160),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(128),
});

function setUserAuthCookies(
  req: Request,
  res: Response,
  accessToken: string,
  refreshToken: string
): void {
  const isSecure = req.secure || req.header('x-forwarded-proto') === 'https';
  res.cookie(
    USER_ACCESS_COOKIE,
    accessToken,
    getUserCookieOptions(USER_ACCESS_COOKIE_MAX_AGE, isSecure)
  );
  res.cookie(
    USER_REFRESH_COOKIE,
    refreshToken,
    getUserCookieOptions(USER_REFRESH_COOKIE_MAX_AGE, isSecure)
  );
}

function clearUserAuthCookies(req: Request, res: Response): void {
  const isSecure = req.secure || req.header('x-forwarded-proto') === 'https';
  const baseOptions = {
    httpOnly: true,
    secure: isSecure,
    sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax',
    path: '/api',
  };
  res.clearCookie(USER_ACCESS_COOKIE, baseOptions);
  res.clearCookie(USER_REFRESH_COOKIE, baseOptions);
}

export async function registerUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(
        res,
        400,
        'Invalid registration fields.',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
      return;
    }

    const result = await registerUser(parsed.data);
    setUserAuthCookies(req, res, result.accessToken, result.refreshToken);
    sendSuccess(res, 201, 'Account created successfully.', { user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function loginUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(
        res,
        400,
        'Invalid login credentials.',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
      return;
    }

    const result = await loginUser(parsed.data.identifier, parsed.data.password);
    setUserAuthCookies(req, res, result.accessToken, result.refreshToken);
    sendSuccess(res, 200, 'Signed in successfully.', { user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function loginDemoUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await loginDemoMarketplaceUser();
    setUserAuthCookies(req, res, result.accessToken, result.refreshToken);
    sendSuccess(res, 200, 'Signed in with demo marketplace account.', { user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function refreshUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken = req.cookies?.[USER_REFRESH_COOKIE];
    if (typeof refreshToken !== 'string' || !refreshToken) {
      sendError(res, 401, 'Refresh session not found.');
      return;
    }

    const result = await refreshUserSession(refreshToken);
    setUserAuthCookies(req, res, result.accessToken, result.refreshToken);
    sendSuccess(res, 200, 'Session refreshed.', { user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function getUserMeHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      sendError(res, 401, 'Not authenticated.');
      return;
    }

    const user = await getUserProfileById(req.auth.userId);
    sendSuccess(res, 200, 'Authenticated user loaded.', { user });
  } catch (err) {
    next(err);
  }
}

export async function logoutUserHandler(req: Request, res: Response): Promise<void> {
  clearUserAuthCookies(req, res);
  sendSuccess(res, 200, 'Signed out successfully.', { signedOut: true });
}
