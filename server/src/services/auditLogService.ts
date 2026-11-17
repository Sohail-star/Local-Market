import type { AdminRoleCode, Prisma, PrismaClient } from '@prisma/client';
import type { Request } from 'express';

type PrismaTransactionOrClient = PrismaClient | Prisma.TransactionClient;

export interface RequestAuditMeta {
  ipAddress?: string;
  userAgent?: string;
}

export interface RecordAdminAuditLogInput {
  actorUserId: string;
  actorRoleCode: AdminRoleCode;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string;
  previousState?: Prisma.InputJsonValue;
  newState?: Prisma.InputJsonValue;
  meta?: RequestAuditMeta;
}

export function extractRequestAuditMeta(req: Request): RequestAuditMeta {
  const forwarded = req.headers['x-forwarded-for'];
  const ipFromHeader = Array.isArray(forwarded)
    ? forwarded[0]
    : typeof forwarded === 'string'
      ? forwarded.split(',')[0]?.trim()
      : undefined;

  const userAgentHeader = req.headers['user-agent'];
  const userAgent =
    typeof userAgentHeader === 'string' ? userAgentHeader.slice(0, 250) : undefined;

  return {
    ipAddress: ipFromHeader || req.ip || undefined,
    userAgent,
  };
}

export async function recordAdminAuditLog(
  db: PrismaTransactionOrClient,
  input: RecordAdminAuditLogInput
): Promise<void> {
  await db.adminAuditLog.create({
    data: {
      actorUserId: input.actorUserId,
      actorRoleCode: input.actorRoleCode,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason ?? null,
      previousState: input.previousState,
      newState: input.newState,
      ipAddress: input.meta?.ipAddress ?? null,
      userAgent: input.meta?.userAgent ?? null,
    },
  });
}
