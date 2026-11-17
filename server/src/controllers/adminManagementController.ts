import type { AccountStatus, AdminRoleCode, ReportStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import { getPrismaClient } from '../config/prisma.ts';
import {
  isStrongAdminPassword,
  isValidPakistaniPhone,
  normalizePakistaniPhone,
} from '../services/adminAuthService.ts';
import { extractRequestAuditMeta, recordAdminAuditLog } from '../services/auditLogService.ts';
import type { AuthenticatedRequest } from '../types/api.ts';
import { AppError, sendSuccess } from '../utils/apiResponse.ts';

const BCRYPT_SALT_ROUNDS = 12;

export const ADMIN_ASSIGNABLE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MODERATOR',
  'SUPPORT',
] as const;

export const createAdminAccountSchema = z.object({
  mode: z.enum(['create', 'promote']).default('create'),
  email: z.string().trim().email('Valid email address is required.').max(160),
  roleCode: z.enum(ADMIN_ASSIGNABLE_ROLES),
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(20).optional(),
  password: z.string().max(128).optional(),
  province: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  area: z.string().trim().max(120).optional(),
  reason: z.string().trim().max(240).optional(),
});

export const updateAdminRoleSchema = z.object({
  roleCode: z.enum(ADMIN_ASSIGNABLE_ROLES),
  action: z.enum(['assign', 'revoke']),
  reason: z.string().trim().max(240).optional(),
});

export const updateAccountStatusSchema = z.object({
  accountStatus: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'DEACTIVATED']),
  reason: z.string().trim().max(240).optional(),
});

export const updateUserVerificationSchema = z.object({
  sellerVerified: z.boolean().optional(),
  providerVerified: z.boolean().optional(),
  isPhoneVerified: z.boolean().optional(),
  reason: z.string().trim().max(240).optional(),
});

export const updateAbuseReportSchema = z.object({
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']),
  resolutionNote: z.string().trim().max(500).optional(),
});

function requireDb() {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AppError(503, 'PostgreSQL database is not connected.');
  }
  return prisma;
}

export async function listAdminAccountsHandler(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = requireDb();

    const adminUsers = await prisma.user.findMany({
      where: {
        adminRoleAssignments: {
          some: {},
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        province: true,
        city: true,
        area: true,
        accountStatus: true,
        lastLoginAt: true,
        createdAt: true,
        adminRoleAssignments: {
          include: {
            role: {
              select: {
                code: true,
                name: true,
              },
            },
            grantedBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: { grantedAt: 'desc' },
        },
        _count: {
          select: {
            adminSessions: {
              where: {
                revokedAt: null,
                expiresAt: { gt: new Date() },
              },
            },
          },
        },
      },
    });

    const formatted = adminUsers.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      city: u.city,
      province: u.province,
      area: u.area,
      accountStatus: u.accountStatus,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      activeSessionCount: u._count.adminSessions,
      roles: u.adminRoleAssignments.map((assignment) => ({
        code: assignment.role.code,
        name: assignment.role.name,
        isActive: assignment.isActive && assignment.revokedAt === null,
        grantedAt: assignment.grantedAt,
        revokedAt: assignment.revokedAt,
        grantedBy: assignment.grantedBy,
      })),
    }));

    sendSuccess(res, 200, 'Administrator accounts retrieved.', {
      accounts: formatted,
    });
  } catch (err) {
    next(err);
  }
}

export async function createOrAssignAdminAccountHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = requireDb();
    const actor = req.adminAuth!;
    const meta = extractRequestAuditMeta(req);
    const body = req.body as z.infer<typeof createAdminAccountSchema>;

    const normalizedEmail = body.email.trim().toLowerCase();
    const roleRecord = await prisma.adminRole.findUnique({
      where: { code: body.roleCode as AdminRoleCode },
    });
    if (!roleRecord) {
      throw new AppError(400, `Role "${body.roleCode}" is not configured in admin_roles.`);
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          adminRoleAssignments: {
            include: { role: true },
          },
        },
      });

      if (body.mode === 'promote') {
        if (!existingUser) {
          throw new AppError(404, `No user found with email "${normalizedEmail}".`);
        }

        await tx.userAdminRole.upsert({
          where: {
            userId_roleId: {
              userId: existingUser.id,
              roleId: roleRecord.id,
            },
          },
          update: {
            isActive: true,
            revokedAt: null,
            grantedById: actor.userId,
            grantedAt: new Date(),
          },
          create: {
            userId: existingUser.id,
            roleId: roleRecord.id,
            grantedById: actor.userId,
            isActive: true,
          },
        });

        await recordAdminAuditLog(tx, {
          actorUserId: actor.userId,
          actorRoleCode: actor.activeRole,
          action: 'ADMIN_ROLE_ASSIGNED',
          targetType: 'UserAdminRole',
          targetId: existingUser.id,
          reason: body.reason || `Promoted existing account to ${body.roleCode}.`,
          newState: { targetEmail: existingUser.email, roleCode: body.roleCode },
          meta,
        });

        return {
          id: existingUser.id,
          fullName: existingUser.fullName,
          email: existingUser.email,
          assignedRole: body.roleCode,
          mode: 'promote',
        };
      }

      // Create new dedicated admin account (strictly separate from ordinary capabilities)
      if (existingUser) {
        throw new AppError(
          409,
          'An account with this email already exists. Use mode="promote" to assign an admin role.'
        );
      }

      if (!body.fullName || body.fullName.trim().length < 2) {
        throw new AppError(400, 'Full name is required when creating a new admin account.');
      }
      if (!body.phone || !isValidPakistaniPhone(body.phone)) {
        throw new AppError(400, 'Valid Pakistani phone number (03XX-XXXXXXX) is required.');
      }
      if (!body.password) {
        throw new AppError(400, 'Strong password is required for new admin accounts.');
      }
      const passwordCheck = isStrongAdminPassword(body.password);
      if (!passwordCheck.valid) {
        throw new AppError(400, passwordCheck.reason || 'Weak password.');
      }

      const normalizedPhone = normalizePakistaniPhone(body.phone);
      const duplicatePhone = await tx.user.findUnique({ where: { phone: normalizedPhone } });
      if (duplicatePhone) {
        throw new AppError(409, 'An account with this phone number already exists.');
      }

      const passwordHash = await bcrypt.hash(body.password, BCRYPT_SALT_ROUNDS);
      const createdUser = await tx.user.create({
        data: {
          fullName: body.fullName.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          passwordHash,
          province: body.province?.trim() || 'Khyber Pakhtunkhwa',
          city: body.city?.trim() || 'Peshawar',
          area: body.area?.trim() || 'University Road',
          accountStatus: 'ACTIVE',
          isEmailVerified: true,
          isPhoneVerified: true,
        },
      });

      await tx.userAdminRole.create({
        data: {
          userId: createdUser.id,
          roleId: roleRecord.id,
          grantedById: actor.userId,
          isActive: true,
        },
      });

      await recordAdminAuditLog(tx, {
        actorUserId: actor.userId,
        actorRoleCode: actor.activeRole,
        action: 'ADMIN_ACCOUNT_CREATED',
        targetType: 'User',
        targetId: createdUser.id,
        reason: body.reason || `Created new ${body.roleCode} account.`,
        newState: {
          targetEmail: createdUser.email,
          assignedRole: body.roleCode,
        },
        meta,
      });

      return {
        id: createdUser.id,
        fullName: createdUser.fullName,
        email: createdUser.email,
        assignedRole: body.roleCode,
        mode: 'create',
      };
    });

    sendSuccess(
      res,
      result.mode === 'create' ? 201 : 200,
      `Administrator role ${body.roleCode} assigned successfully.`,
      result
    );
  } catch (err) {
    next(err);
  }
}

export async function updateAdminRoleAssignmentHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = requireDb();
    const actor = req.adminAuth!;
    const meta = extractRequestAuditMeta(req);
    const userId = String(req.params.userId);
    const { roleCode, action, reason } = req.body as z.infer<typeof updateAdminRoleSchema>;

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      throw new AppError(404, 'Target user account not found.');
    }

    const roleRecord = await prisma.adminRole.findUnique({
      where: { code: roleCode as AdminRoleCode },
    });
    if (!roleRecord) {
      throw new AppError(400, `Unknown admin role: ${roleCode}`);
    }

    await prisma.$transaction(async (tx) => {
      if (action === 'assign') {
        await tx.userAdminRole.upsert({
          where: {
            userId_roleId: {
              userId: targetUser.id,
              roleId: roleRecord.id,
            },
          },
          update: {
            isActive: true,
            revokedAt: null,
            grantedById: actor.userId,
            grantedAt: new Date(),
          },
          create: {
            userId: targetUser.id,
            roleId: roleRecord.id,
            grantedById: actor.userId,
            isActive: true,
          },
        });

        await recordAdminAuditLog(tx, {
          actorUserId: actor.userId,
          actorRoleCode: actor.activeRole,
          action: 'ADMIN_ROLE_ASSIGNED',
          targetType: 'UserAdminRole',
          targetId: targetUser.id,
          reason: reason || `Assigned ${roleCode} to ${targetUser.email}.`,
          newState: { roleCode, isActive: true },
          meta,
        });
        return;
      }

      // Guard against revoking the last remaining active SUPER_ADMIN
      if (roleCode === 'SUPER_ADMIN') {
        const activeSuperAdmins = await tx.userAdminRole.count({
          where: {
            isActive: true,
            revokedAt: null,
            role: { code: 'SUPER_ADMIN' },
            user: { accountStatus: 'ACTIVE' },
          },
        });

        const targetHoldsSuperAdmin = await tx.userAdminRole.findFirst({
          where: {
            userId: targetUser.id,
            roleId: roleRecord.id,
            isActive: true,
            revokedAt: null,
          },
        });

        if (targetHoldsSuperAdmin && activeSuperAdmins <= 1) {
          throw new AppError(
            409,
            'Cannot revoke the last remaining active SUPER_ADMIN account.'
          );
        }
      }

      await tx.userAdminRole.updateMany({
        where: {
          userId: targetUser.id,
          roleId: roleRecord.id,
          isActive: true,
        },
        data: {
          isActive: false,
          revokedAt: new Date(),
        },
      });

      // Immediately revoke active admin sessions for that user so privilege drop takes effect now
      await tx.adminSession.updateMany({
        where: {
          userId: targetUser.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      await recordAdminAuditLog(tx, {
        actorUserId: actor.userId,
        actorRoleCode: actor.activeRole,
        action: 'ADMIN_ROLE_REVOKED',
        targetType: 'UserAdminRole',
        targetId: targetUser.id,
        reason: reason || `Revoked ${roleCode} from ${targetUser.email}.`,
        previousState: { roleCode, isActive: true },
        newState: { roleCode, isActive: false },
        meta,
      });
    });

    sendSuccess(
      res,
      200,
      `Role ${roleCode} ${action === 'assign' ? 'assigned' : 'revoked'} successfully.`,
      { userId: targetUser.id, roleCode, action }
    );
  } catch (err) {
    next(err);
  }
}

export async function updateAccountStatusHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = requireDb();
    const actor = req.adminAuth!;
    const meta = extractRequestAuditMeta(req);
    const userId = String(req.params.userId);
    const { accountStatus, reason } = req.body as z.infer<typeof updateAccountStatusSchema>;

    if (userId === actor.userId && accountStatus !== 'ACTIVE') {
      throw new AppError(409, 'You cannot suspend or deactivate your own active admin account.');
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      throw new AppError(404, 'Target account not found.');
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: target.id },
        data: { accountStatus: accountStatus as AccountStatus },
      });

      if (accountStatus !== 'ACTIVE') {
        await tx.adminSession.updateMany({
          where: { userId: target.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      await recordAdminAuditLog(tx, {
        actorUserId: actor.userId,
        actorRoleCode: actor.activeRole,
        action: 'USER_ACCOUNT_STATUS_UPDATED',
        targetType: 'User',
        targetId: target.id,
        reason: reason || `Account status changed to ${accountStatus}.`,
        previousState: { accountStatus: target.accountStatus },
        newState: { accountStatus },
        meta,
      });
    });

    sendSuccess(res, 200, `Account status updated to ${accountStatus}.`, {
      userId: target.id,
      accountStatus,
    });
  } catch (err) {
    next(err);
  }
}

export async function listMarketplaceUsersHandler(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = requireDb();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        province: true,
        city: true,
        area: true,
        accountStatus: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        sellerVerified: true,
        providerVerified: true,
        createdAt: true,
        capabilities: {
          select: {
            capability: true,
            isEnabled: true,
          },
        },
        adminRoleAssignments: {
          where: { isActive: true, revokedAt: null },
          select: {
            role: { select: { code: true } },
          },
        },
      },
    });

    sendSuccess(res, 200, 'Marketplace accounts retrieved.', {
      users: users.map((u) => ({
        ...u,
        adminRoles: u.adminRoleAssignments.map((a) => a.role.code),
        adminRoleAssignments: undefined,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserVerificationHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = requireDb();
    const actor = req.adminAuth!;
    const meta = extractRequestAuditMeta(req);
    const userId = String(req.params.userId);
    const body = req.body as z.infer<typeof updateUserVerificationSchema>;

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      throw new AppError(404, 'User not found.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const nextUser = await tx.user.update({
        where: { id: target.id },
        data: {
          ...(typeof body.sellerVerified === 'boolean'
            ? { sellerVerified: body.sellerVerified }
            : {}),
          ...(typeof body.providerVerified === 'boolean'
            ? { providerVerified: body.providerVerified }
            : {}),
          ...(typeof body.isPhoneVerified === 'boolean'
            ? { isPhoneVerified: body.isPhoneVerified }
            : {}),
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          sellerVerified: true,
          providerVerified: true,
          isPhoneVerified: true,
        },
      });

      await recordAdminAuditLog(tx, {
        actorUserId: actor.userId,
        actorRoleCode: actor.activeRole,
        action: 'USER_VERIFICATION_UPDATED',
        targetType: 'User',
        targetId: target.id,
        reason: body.reason || 'Updated user verification flags.',
        previousState: {
          sellerVerified: target.sellerVerified,
          providerVerified: target.providerVerified,
          isPhoneVerified: target.isPhoneVerified,
        },
        newState: {
          sellerVerified: nextUser.sellerVerified,
          providerVerified: nextUser.providerVerified,
          isPhoneVerified: nextUser.isPhoneVerified,
        },
        meta,
      });

      return nextUser;
    });

    sendSuccess(res, 200, 'User verification status updated.', { user: updated });
  } catch (err) {
    next(err);
  }
}

export async function listAbuseReportsHandler(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = requireDb();
    const reports = await prisma.abuseReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
        assignedAdmin: { select: { id: true, fullName: true, email: true } },
      },
    });

    sendSuccess(res, 200, 'Abuse reports retrieved.', { reports });
  } catch (err) {
    next(err);
  }
}

export async function updateAbuseReportHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = requireDb();
    const actor = req.adminAuth!;
    const meta = extractRequestAuditMeta(req);
    const reportId = String(req.params.reportId);
    const body = req.body as z.infer<typeof updateAbuseReportSchema>;

    const existing = await prisma.abuseReport.findUnique({ where: { id: reportId } });
    if (!existing) {
      throw new AppError(404, 'Abuse report not found.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const nextReport = await tx.abuseReport.update({
        where: { id: existing.id },
        data: {
          status: body.status as ReportStatus,
          resolutionNote: body.resolutionNote ?? existing.resolutionNote,
          assignedAdminId: actor.userId,
          resolvedAt:
            body.status === 'RESOLVED' || body.status === 'DISMISSED' ? new Date() : null,
        },
      });

      await recordAdminAuditLog(tx, {
        actorUserId: actor.userId,
        actorRoleCode: actor.activeRole,
        action: 'ABUSE_REPORT_UPDATED',
        targetType: 'AbuseReport',
        targetId: existing.id,
        reason: body.resolutionNote || `Report marked ${body.status}.`,
        previousState: { status: existing.status },
        newState: { status: nextReport.status, resolutionNote: nextReport.resolutionNote },
        meta,
      });

      return nextReport;
    });

    sendSuccess(res, 200, 'Abuse report updated.', { report: updated });
  } catch (err) {
    next(err);
  }
}

export async function listAdminAuditLogsHandler(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = requireDb();
    const logs = await prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    sendSuccess(res, 200, 'Admin audit logs retrieved.', { logs });
  } catch (err) {
    next(err);
  }
}
