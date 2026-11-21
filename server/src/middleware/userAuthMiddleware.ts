import type { NextFunction, Response } from 'express';
import { getPrismaClient } from '../config/prisma.ts';
import {
  USER_ACCESS_COOKIE,
  isUserAuthConfigured,
  verifyUserAccessToken,
} from '../services/userAuthService.ts';
import type { AuthenticatedRequest, CapabilityKey } from '../types/api.ts';
import { sendError } from '../utils/apiResponse.ts';

function extractUserAccessToken(req: AuthenticatedRequest): string | null {
  const cookieToken = req.cookies?.[USER_ACCESS_COOKIE];
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

export async function requireUserAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!isUserAuthConfigured()) {
    sendError(res, 503, 'Authentication secrets are not configured.');
    return;
  }

  const token = extractUserAccessToken(req);
  if (!token) {
    sendError(res, 401, 'Please sign in to access LocalMarket messaging.');
    return;
  }

  let decoded;
  try {
    decoded = verifyUserAccessToken(token);
  } catch {
    sendError(res, 401, 'Your session has expired. Please sign in again.');
    return;
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, 503, 'Database unavailable.');
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { capabilities: true },
    });

    if (!user || user.accountStatus !== 'ACTIVE') {
      sendError(res, 401, 'User account not found or inactive.');
      return;
    }

    const capabilities: Record<CapabilityKey, boolean> = {
      buy: true,
      sell: false,
      offerServices: false,
      hireProviders: true,
    };

    if (user.capabilities.length > 0) {
      capabilities.buy = false;
      capabilities.sell = false;
      capabilities.offerServices = false;
      capabilities.hireProviders = false;
      for (const c of user.capabilities) {
        if (c.capability === 'BUY' && c.isEnabled) capabilities.buy = true;
        if (c.capability === 'SELL' && c.isEnabled) capabilities.sell = true;
        if (c.capability === 'OFFER_SERVICES' && c.isEnabled) capabilities.offerServices = true;
        if (c.capability === 'HIRE_PROVIDERS' && c.isEnabled) capabilities.hireProviders = true;
      }
    }

    req.auth = {
      userId: user.id,
      email: user.email,
      capabilities,
    };

    next();
  } catch (err) {
    next(err);
  }
}
