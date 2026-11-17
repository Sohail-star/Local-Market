import type { Request } from 'express';

export type CapabilityKey = 'buy' | 'sell' | 'offerServices' | 'hireProviders';

export interface AuthenticatedUserContext {
  userId: string;
  email: string;
  isAdmin: boolean;
  capabilities: Record<CapabilityKey, boolean>;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthenticatedUserContext;
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
