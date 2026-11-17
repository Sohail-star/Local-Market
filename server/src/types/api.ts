import type { AdminRoleCode } from '@prisma/client';
import type { Request } from 'express';

export type CapabilityKey = 'buy' | 'sell' | 'offerServices' | 'hireProviders';

export interface AuthenticatedUserContext {
  userId: string;
  email: string;
  capabilities: Record<CapabilityKey, boolean>;
}

export interface AuthenticatedAdminContext {
  userId: string;
  email: string;
  fullName: string;
  sessionId: string;
  activeRole: AdminRoleCode;
  roles: AdminRoleCode[];
  permissions: string[];
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthenticatedUserContext;
  adminAuth?: AuthenticatedAdminContext;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: ApiErrorDetail[];
}
