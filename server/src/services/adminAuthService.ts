import crypto from 'node:crypto';
import type { AdminRoleCode, CapabilityType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import { getPrismaClient } from '../config/prisma.ts';
import { AppError } from '../utils/apiResponse.ts';
import { logger } from '../utils/logger.ts';
import { recordAdminAuditLog, type RequestAuditMeta } from './auditLogService.ts';

export const ADMIN_ACCESS_COOKIE = 'lm_admin_access';
export const ADMIN_REFRESH_COOKIE = 'lm_admin_refresh';

const ADMIN_ACCESS_TTL_SECONDS = 15 * 60; // 15 minutes
const ADMIN_REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const BCRYPT_SALT_ROUNDS = 12;
const DUMMY_PASSWORD_HASH =
  '$2b$12$C6UzMDM.H6dfI/f/IKxGhu67W1G1o1nQvS3wC7u2F2F8G1n8t6b.e';

const ADMIN_ROLE_PRECEDENCE: AdminRoleCode[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'MODERATOR',
  'SUPPORT',
  'SUPPORT_ADMIN',
  'CATALOG_ADMIN',
];

export const MANAGEABLE_ADMIN_ROLES: AdminRoleCode[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'MODERATOR',
  'SUPPORT',
];

export interface AdminAccessJwtPayload {
  sub: string;
  sid: string;
  role: AdminRoleCode;
  roles: AdminRoleCode[];
  typ: 'admin-access';
}

export interface AdminRefreshJwtPayload {
  sub: string;
  sid: string;
  jti: string;
  typ: 'admin-refresh';
}

export interface AdminAccountProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  province: string;
  city: string;
  area: string;
  accountStatus: string;
  activeRole: AdminRoleCode;
  roles: AdminRoleCode[];
  permissions: string[];
  ordinaryCapabilities: {
    buy: boolean;
    sell: boolean;
    offerServices: boolean;
    hireProviders: boolean;
  };
  lastLoginAt: string | null;
}

export interface AdminLoginResult {
  admin: AdminAccountProfile;
  accessToken: string;
  refreshToken: string;
}

export function isStrongAdminPassword(password: string): { valid: boolean; reason?: string } {
  if (password.length < 12) {
    return { valid: false, reason: 'Password must be at least 12 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one digit.' };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one special character.' };
  }
  return { valid: true };
}

export function normalizePakistaniPhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('923') && digits.length === 12) {
    return `0${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  if (digits.startsWith('03') && digits.length === 11) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return rawPhone.trim();
}

export function isValidPakistaniPhone(rawPhone: string): boolean {
  const digits = rawPhone.replace(/\D/g, '');
  return (
    (digits.startsWith('03') && digits.length === 11) ||
    (digits.startsWith('923') && digits.length === 12)
  );
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function timingSafeStringMatch(input: string, expected: string): boolean {
  const a = Buffer.from(input, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function sortRolesByPrecedence(roles: AdminRoleCode[]): AdminRoleCode[] {
  return [...roles].sort((a, b) => {
    const idxA = ADMIN_ROLE_PRECEDENCE.indexOf(a);
    const idxB = ADMIN_ROLE_PRECEDENCE.indexOf(b);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });
}

function mapCapabilitiesList(
  rows: Array<{ capability: CapabilityType; isEnabled: boolean }>
): AdminAccountProfile['ordinaryCapabilities'] {
  const map = new Map(rows.map((r) => [r.capability, r.isEnabled]));
  return {
    buy: Boolean(map.get('BUY')),
    sell: Boolean(map.get('SELL')),
    offerServices: Boolean(map.get('OFFER_SERVICES')),
    hireProviders: Boolean(map.get('HIRE_PROVIDERS')),
  };
}

function signAdminTokens(params: {
  userId: string;
  sessionId: string;
  activeRole: AdminRoleCode;
  roles: AdminRoleCode[];
}): { accessToken: string; refreshToken: string } {
  if (!env.isAdminAuthConfigured) {
    throw new AppError(
      503,
      'Admin authentication secrets (ADMIN_JWT_ACCESS_SECRET / ADMIN_JWT_REFRESH_SECRET or JWT_ACCESS_SECRET / JWT_REFRESH_SECRET) are not configured on the server.'
    );
  }

  const accessPayload: AdminAccessJwtPayload = {
    sub: params.userId,
    sid: params.sessionId,
    role: params.activeRole,
    roles: params.roles,
    typ: 'admin-access',
  };

  const refreshPayload: AdminRefreshJwtPayload = {
    sub: params.userId,
    sid: params.sessionId,
    jti: crypto.randomUUID(),
    typ: 'admin-refresh',
  };

  const accessToken = jwt.sign(accessPayload, env.adminAccessSecret, {
    expiresIn: ADMIN_ACCESS_TTL_SECONDS,
    audience: 'localmarket-admin',
    issuer: 'localmarket-api',
  });

  const refreshToken = jwt.sign(refreshPayload, env.adminRefreshSecret, {
    expiresIn: ADMIN_REFRESH_TTL_SECONDS,
    audience: 'localmarket-admin',
    issuer: 'localmarket-api',
  });

  return { accessToken, refreshToken };
}

export function getAdminCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax' as const,
    path: '/api/admin',
    maxAge: maxAgeSeconds * 1000,
  };
}

export const ADMIN_ACCESS_COOKIE_MAX_AGE = ADMIN_ACCESS_TTL_SECONDS;
export const ADMIN_REFRESH_COOKIE_MAX_AGE = ADMIN_REFRESH_TTL_SECONDS;

export async function getAdminSetupStatus() {
  const prisma = getPrismaClient();
  if (!prisma) {
    return {
      databaseConnected: false,
      superAdminExists: false,
      oneTimeSetupAvailable: false,
      adminAuthConfigured: env.isAdminAuthConfigured,
    };
  }

  const superAdminCount = await prisma.userAdminRole.count({
    where: {
      isActive: true,
      revokedAt: null,
      role: { code: 'SUPER_ADMIN' },
      user: { accountStatus: 'ACTIVE' },
    },
  });

  return {
    databaseConnected: true,
    superAdminExists: superAdminCount > 0,
    oneTimeSetupAvailable: superAdminCount === 0 && env.isAdminSetupTokenConfigured,
    adminAuthConfigured: env.isAdminAuthConfigured,
  };
}

/**
 * Provisions the initial SUPER_ADMIN exclusively from environment secrets when
 * zero active SUPER_ADMIN exists in PostgreSQL. Never runs with default/placeholder values.
 */
export async function provisionInitialSuperAdminFromEnv(): Promise<void> {
  if (!env.isInitialSuperAdminEnvConfigured) {
    return;
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    return;
  }

  const email = env.INITIAL_SUPER_ADMIN_EMAIL.toLowerCase();
  const passwordCheck = isStrongAdminPassword(env.INITIAL_SUPER_ADMIN_PASSWORD);
  if (!passwordCheck.valid) {
    logger.warn(
      'Skipping env-based initial Super Admin provisioning: INITIAL_SUPER_ADMIN_PASSWORD does not meet password strength rules.',
      { reason: passwordCheck.reason }
    );
    return;
  }

  const existingSuperAdminCount = await prisma.userAdminRole.count({
    where: {
      isActive: true,
      revokedAt: null,
      role: { code: 'SUPER_ADMIN' },
    },
  });

  if (existingSuperAdminCount > 0) {
    return;
  }

  const superAdminRole = await prisma.adminRole.findUnique({
    where: { code: 'SUPER_ADMIN' },
  });
  if (!superAdminRole) {
    logger.warn('Skipping env-based initial Super Admin provisioning: SUPER_ADMIN role row not seeded yet.');
    return;
  }

  const passwordHash = await bcrypt.hash(env.INITIAL_SUPER_ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS);
  const fullName = env.INITIAL_SUPER_ADMIN_NAME || 'LocalMarket Super Admin';
  const phone = isValidPakistaniPhone(env.INITIAL_SUPER_ADMIN_PHONE)
    ? normalizePakistaniPhone(env.INITIAL_SUPER_ADMIN_PHONE)
    : `0300-${Math.floor(1000000 + Math.random() * 8999999)}`;

  await prisma.$transaction(async (tx) => {
    const doubleCheck = await tx.userAdminRole.count({
      where: {
        isActive: true,
        revokedAt: null,
        role: { code: 'SUPER_ADMIN' },
      },
    });
    if (doubleCheck > 0) return;

    let user = await tx.user.findUnique({ where: { email } });
    if (!user) {
      user = await tx.user.create({
        data: {
          fullName,
          email,
          phone,
          passwordHash,
          province: 'Khyber Pakhtunkhwa',
          city: 'Peshawar',
          area: 'University Road',
          accountStatus: 'ACTIVE',
          isEmailVerified: true,
          isPhoneVerified: true,
        },
      });
    }

    await tx.userAdminRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: superAdminRole.id,
        },
      },
      update: {
        isActive: true,
        revokedAt: null,
      },
      create: {
        userId: user.id,
        roleId: superAdminRole.id,
        isActive: true,
      },
    });

    await recordAdminAuditLog(tx, {
      actorUserId: user.id,
      actorRoleCode: 'SUPER_ADMIN',
      action: 'INITIAL_SUPER_ADMIN_PROVISIONED',
      targetType: 'UserAdminRole',
      targetId: user.id,
      reason: 'Initial Super Admin provisioned from protected server environment secrets.',
      newState: { roleCode: 'SUPER_ADMIN', method: 'ENV_SECRET' },
    });
  });

  logger.info('Initial SUPER_ADMIN provisioned securely from environment secrets.');
}

/**
 * Protected one-time Super Admin setup endpoint.
 * Permanently locks itself as soon as any active SUPER_ADMIN exists in PostgreSQL.
 */
export async function setupInitialSuperAdminWithToken(
  input: {
    setupToken: string;
    fullName: string;
    email: string;
    phone: string;
    password: string;
    province?: string;
    city?: string;
    area?: string;
  },
  meta: RequestAuditMeta
): Promise<{ id: string; fullName: string; email: string; role: AdminRoleCode }> {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AppError(503, 'PostgreSQL database is not connected.');
  }
  if (!env.isAdminSetupTokenConfigured) {
    throw new AppError(
      503,
      'One-time Super Admin setup is disabled because ADMIN_SETUP_TOKEN is not configured.'
    );
  }
  if (!timingSafeStringMatch(input.setupToken.trim(), env.ADMIN_SETUP_TOKEN)) {
    throw new AppError(403, 'Invalid one-time Super Admin setup token.');
  }

  const passwordCheck = isStrongAdminPassword(input.password);
  if (!passwordCheck.valid) {
    throw new AppError(400, passwordCheck.reason || 'Weak administrator password.');
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedPhone = normalizePakistaniPhone(input.phone);
  if (!isValidPakistaniPhone(normalizedPhone)) {
    throw new AppError(400, 'Enter a valid Pakistani mobile number (03XX-XXXXXXX).');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

  return prisma.$transaction(async (tx) => {
    const existingSuperAdmins = await tx.userAdminRole.count({
      where: {
        isActive: true,
        revokedAt: null,
        role: { code: 'SUPER_ADMIN' },
      },
    });
    if (existingSuperAdmins > 0) {
      throw new AppError(
        409,
        'Initial Super Admin has already been provisioned. One-time setup is permanently locked.'
      );
    }

    const superAdminRole = await tx.adminRole.findUnique({
      where: { code: 'SUPER_ADMIN' },
    });
    if (!superAdminRole) {
      throw new AppError(500, 'SUPER_ADMIN role record is missing from admin_roles.');
    }

    const existingEmail = await tx.user.findUnique({ where: { email: normalizedEmail } });
    if (existingEmail) {
      throw new AppError(409, 'An account with this email already exists.');
    }

    const existingPhone = await tx.user.findUnique({ where: { phone: normalizedPhone } });
    if (existingPhone) {
      throw new AppError(409, 'An account with this phone number already exists.');
    }

    const user = await tx.user.create({
      data: {
        fullName: input.fullName.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash,
        province: input.province?.trim() || 'Khyber Pakhtunkhwa',
        city: input.city?.trim() || 'Peshawar',
        area: input.area?.trim() || 'University Road',
        accountStatus: 'ACTIVE',
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    await tx.userAdminRole.create({
      data: {
        userId: user.id,
        roleId: superAdminRole.id,
        isActive: true,
      },
    });

    await recordAdminAuditLog(tx, {
      actorUserId: user.id,
      actorRoleCode: 'SUPER_ADMIN',
      action: 'ONE_TIME_SUPER_ADMIN_SETUP',
      targetType: 'UserAdminRole',
      targetId: user.id,
      reason: 'Initial Super Admin created via protected one-time setup token.',
      newState: { roleCode: 'SUPER_ADMIN', method: 'ONE_TIME_SETUP_TOKEN' },
      meta,
    });

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: 'SUPER_ADMIN' as AdminRoleCode,
    };
  });
}

export async function loginAdmin(
  input: {
    email: string;
    password: string;
    preferredRole?: AdminRoleCode;
  },
  meta: RequestAuditMeta
): Promise<AdminLoginResult> {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AppError(503, 'PostgreSQL database is not connected.');
  }
  if (!env.isAdminAuthConfigured) {
    throw new AppError(
      503,
      'Admin authentication secrets are not configured in the server environment.'
    );
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      capabilities: true,
      adminRoleAssignments: {
        where: { isActive: true, revokedAt: null },
        include: { role: true },
      },
    },
  });

  const passwordValid = await bcrypt.compare(
    input.password,
    user ? user.passwordHash : DUMMY_PASSWORD_HASH
  );

  if (!user || !passwordValid) {
    if (user && user.adminRoleAssignments.length > 0) {
      const assignedRoles = sortRolesByPrecedence(
        user.adminRoleAssignments.map((a) => a.role.code)
      );
      await recordAdminAuditLog(prisma, {
        actorUserId: user.id,
        actorRoleCode: assignedRoles[0],
        action: 'ADMIN_LOGIN_FAILED',
        targetType: 'AdminSession',
        targetId: user.id,
        reason: 'Invalid administrator credentials supplied.',
        meta,
      });
    }
    throw new AppError(401, 'Invalid administrator email or password.');
  }

  if (user.accountStatus !== 'ACTIVE') {
    throw new AppError(
      403,
      `Administrator account is currently ${user.accountStatus.toLowerCase()}.`
    );
  }

  const assignedRoles = sortRolesByPrecedence(
    user.adminRoleAssignments.map((assignment) => assignment.role.code)
  );

  if (assignedRoles.length === 0) {
    throw new AppError(
      403,
      'This account does not hold server-assigned administrator privileges.'
    );
  }

  // Never trust a frontend-supplied role unless verified against active UserAdminRole records
  const activeRole =
    input.preferredRole && assignedRoles.includes(input.preferredRole)
      ? input.preferredRole
      : assignedRoles[0];

  const permissions = Array.from(
    new Set(user.adminRoleAssignments.flatMap((a) => a.role.permissions))
  );

  const sessionId = crypto.randomUUID();
  const tokens = signAdminTokens({
    userId: user.id,
    sessionId,
    activeRole,
    roles: assignedRoles,
  });

  const expiresAt = new Date(Date.now() + ADMIN_REFRESH_TTL_SECONDS * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.adminSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        tokenHash: hashToken(tokens.refreshToken),
        activeRoleCode: activeRole,
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
        expiresAt,
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await recordAdminAuditLog(tx, {
      actorUserId: user.id,
      actorRoleCode: activeRole,
      action: 'ADMIN_LOGIN_SUCCESS',
      targetType: 'AdminSession',
      targetId: sessionId,
      newState: { activeRole, assignedRoles },
      meta,
    });
  });

  return {
    admin: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      province: user.province,
      city: user.city,
      area: user.area,
      accountStatus: user.accountStatus,
      activeRole,
      roles: assignedRoles,
      permissions,
      ordinaryCapabilities: mapCapabilitiesList(user.capabilities),
      lastLoginAt: new Date().toISOString(),
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export async function refreshAdminSession(
  rawRefreshToken: string,
  meta: RequestAuditMeta
): Promise<AdminLoginResult> {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AppError(503, 'PostgreSQL database is not connected.');
  }
  if (!env.isAdminAuthConfigured) {
    throw new AppError(503, 'Admin authentication secrets are not configured.');
  }

  let decoded: AdminRefreshJwtPayload;
  try {
    decoded = jwt.verify(rawRefreshToken, env.adminRefreshSecret, {
      audience: 'localmarket-admin',
      issuer: 'localmarket-api',
    }) as AdminRefreshJwtPayload;
  } catch {
    throw new AppError(401, 'Invalid or expired admin refresh token.');
  }

  if (decoded.typ !== 'admin-refresh' || !decoded.sid || !decoded.sub) {
    throw new AppError(401, 'Malformed admin refresh token.');
  }

  const incomingHash = hashToken(rawRefreshToken);
  const existingSession = await prisma.adminSession.findUnique({
    where: { id: decoded.sid },
    include: {
      user: {
        include: {
          capabilities: true,
          adminRoleAssignments: {
            where: { isActive: true, revokedAt: null },
            include: { role: true },
          },
        },
      },
    },
  });

  if (
    !existingSession ||
    existingSession.revokedAt ||
    existingSession.expiresAt <= new Date() ||
    existingSession.tokenHash !== incomingHash
  ) {
    // Possible refresh token reuse — revoke session cleanly if it exists
    if (existingSession && !existingSession.revokedAt) {
      await prisma.adminSession.update({
        where: { id: existingSession.id },
        data: { revokedAt: new Date() },
      });
    }
    throw new AppError(401, 'Admin session expired or revoked. Please sign in again.');
  }

  const user = existingSession.user;
  if (user.accountStatus !== 'ACTIVE') {
    throw new AppError(403, 'Administrator account is not active.');
  }

  const assignedRoles = sortRolesByPrecedence(
    user.adminRoleAssignments.map((a) => a.role.code)
  );
  if (assignedRoles.length === 0) {
    await prisma.adminSession.update({
      where: { id: existingSession.id },
      data: { revokedAt: new Date() },
    });
    throw new AppError(403, 'Administrator privileges have been revoked.');
  }

  const activeRole = assignedRoles.includes(existingSession.activeRoleCode)
    ? existingSession.activeRoleCode
    : assignedRoles[0];

  const permissions = Array.from(
    new Set(user.adminRoleAssignments.flatMap((a) => a.role.permissions))
  );

  const tokens = signAdminTokens({
    userId: user.id,
    sessionId: existingSession.id,
    activeRole,
    roles: assignedRoles,
  });

  await prisma.adminSession.update({
    where: { id: existingSession.id },
    data: {
      tokenHash: hashToken(tokens.refreshToken),
      activeRoleCode: activeRole,
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + ADMIN_REFRESH_TTL_SECONDS * 1000),
      ipAddress: meta.ipAddress ?? existingSession.ipAddress,
      userAgent: meta.userAgent ?? existingSession.userAgent,
    },
  });

  return {
    admin: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      province: user.province,
      city: user.city,
      area: user.area,
      accountStatus: user.accountStatus,
      activeRole,
      roles: assignedRoles,
      permissions,
      ordinaryCapabilities: mapCapabilitiesList(user.capabilities),
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export async function logoutAdminSession(params: {
  sessionId?: string;
  rawRefreshToken?: string;
  actorUserId?: string;
  actorRoleCode?: AdminRoleCode;
  meta: RequestAuditMeta;
}): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) return;

  let targetSessionId = params.sessionId;
  let targetUserId = params.actorUserId;
  let targetRole = params.actorRoleCode;

  if (!targetSessionId && params.rawRefreshToken) {
    const tokenRecord = await prisma.adminSession.findUnique({
      where: { tokenHash: hashToken(params.rawRefreshToken) },
    });
    if (tokenRecord) {
      targetSessionId = tokenRecord.id;
      targetUserId = tokenRecord.userId;
      targetRole = tokenRecord.activeRoleCode;
    }
  }

  if (targetSessionId) {
    await prisma.adminSession.updateMany({
      where: { id: targetSessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (targetUserId && targetRole) {
      await recordAdminAuditLog(prisma, {
        actorUserId: targetUserId,
        actorRoleCode: targetRole,
        action: 'ADMIN_LOGOUT',
        targetType: 'AdminSession',
        targetId: targetSessionId,
        meta: params.meta,
      });
    }
  }
}

export async function getAuthenticatedAdminProfile(
  userId: string,
  activeRole: AdminRoleCode
): Promise<AdminAccountProfile> {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AppError(503, 'PostgreSQL database is not connected.');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      capabilities: true,
      adminRoleAssignments: {
        where: { isActive: true, revokedAt: null },
        include: { role: true },
      },
    },
  });

  if (!user || user.accountStatus !== 'ACTIVE') {
    throw new AppError(401, 'Administrator account is unavailable.');
  }

  const roles = sortRolesByPrecedence(user.adminRoleAssignments.map((a) => a.role.code));
  if (roles.length === 0) {
    throw new AppError(403, 'Administrator privileges have been revoked.');
  }

  const resolvedActiveRole = roles.includes(activeRole) ? activeRole : roles[0];
  const permissions = Array.from(
    new Set(user.adminRoleAssignments.flatMap((a) => a.role.permissions))
  );

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    province: user.province,
    city: user.city,
    area: user.area,
    accountStatus: user.accountStatus,
    activeRole: resolvedActiveRole,
    roles,
    permissions,
    ordinaryCapabilities: mapCapabilitiesList(user.capabilities),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  };
}
