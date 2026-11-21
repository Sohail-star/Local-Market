import crypto from 'node:crypto';
import type { CapabilityType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import { getPrismaClient } from '../config/prisma.ts';
import { AppError } from '../utils/apiResponse.ts';
import { isValidPakistaniPhone, normalizePakistaniPhone } from './adminAuthService.ts';

export const USER_ACCESS_COOKIE = 'lm_user_access';
export const USER_REFRESH_COOKIE = 'lm_user_refresh';

export const USER_ACCESS_TTL_SECONDS = 2 * 60 * 60; // 2 hours
export const USER_REFRESH_TTL_SECONDS = 14 * 24 * 60 * 60; // 14 days
export const USER_ACCESS_COOKIE_MAX_AGE = USER_ACCESS_TTL_SECONDS * 1000;
export const USER_REFRESH_COOKIE_MAX_AGE = USER_REFRESH_TTL_SECONDS * 1000;

const BCRYPT_SALT_ROUNDS = 10;

export interface UserAccessJwtPayload {
  sub: string;
  email: string;
  typ: 'user-access';
}

export interface UserRefreshJwtPayload {
  sub: string;
  jti: string;
  typ: 'user-refresh';
}

export interface UserAccountDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  province: string;
  city: string;
  area: string;
  avatarUrl?: string;
  capabilities: {
    buy: boolean;
    sell: boolean;
    offerServices: boolean;
    hireProviders: boolean;
  };
  role: 'Buyer' | 'Seller' | 'Service Provider';
  memberSince: string;
}

export interface UserAuthResult {
  user: UserAccountDto;
  accessToken: string;
  refreshToken: string;
}

function getUserAccessSecret(): string {
  if (env.JWT_ACCESS_SECRET && !env.JWT_ACCESS_SECRET.includes('CHANGE_ME')) {
    return env.JWT_ACCESS_SECRET;
  }
  return env.adminAccessSecret;
}

function getUserRefreshSecret(): string {
  if (env.JWT_REFRESH_SECRET && !env.JWT_REFRESH_SECRET.includes('CHANGE_ME')) {
    return env.JWT_REFRESH_SECRET;
  }
  return env.adminRefreshSecret;
}

export function isUserAuthConfigured(): boolean {
  return getUserAccessSecret().length >= 16 && getUserRefreshSecret().length >= 16;
}

export function getUserCookieOptions(maxAge: number, isSecure: boolean) {
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax',
    path: '/api',
    maxAge,
  };
}

function formatMemberSince(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function mapUserRecordToDto(user: {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  province: string;
  city: string;
  area: string;
  avatarUrl: string | null;
  createdAt: Date;
  capabilities: { capability: CapabilityType; isEnabled: boolean }[];
}): UserAccountDto {
  const capMap = {
    buy: true,
    sell: false,
    offerServices: false,
    hireProviders: true,
  };

  if (user.capabilities.length > 0) {
    capMap.buy = false;
    capMap.sell = false;
    capMap.offerServices = false;
    capMap.hireProviders = false;
    for (const c of user.capabilities) {
      if (c.capability === 'BUY' && c.isEnabled) capMap.buy = true;
      if (c.capability === 'SELL' && c.isEnabled) capMap.sell = true;
      if (c.capability === 'OFFER_SERVICES' && c.isEnabled) capMap.offerServices = true;
      if (c.capability === 'HIRE_PROVIDERS' && c.isEnabled) capMap.hireProviders = true;
    }
  }

  const role: UserAccountDto['role'] = capMap.offerServices
    ? 'Service Provider'
    : capMap.sell
      ? 'Seller'
      : 'Buyer';

  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    phone: user.phone || '0300-0000000',
    province: user.province,
    city: user.city,
    area: user.area,
    avatarUrl: user.avatarUrl || undefined,
    capabilities: capMap,
    role,
    memberSince: formatMemberSince(user.createdAt),
  };
}

function issueUserTokens(userId: string, email: string): { accessToken: string; refreshToken: string } {
  const accessSecret = getUserAccessSecret();
  const refreshSecret = getUserRefreshSecret();
  if (!accessSecret || !refreshSecret) {
    throw new AppError(503, 'User authentication secrets are not configured.');
  }

  const accessPayload: UserAccessJwtPayload = {
    sub: userId,
    email,
    typ: 'user-access',
  };

  const refreshPayload: UserRefreshJwtPayload = {
    sub: userId,
    jti: crypto.randomUUID(),
    typ: 'user-refresh',
  };

  const accessToken = jwt.sign(accessPayload, accessSecret, {
    expiresIn: USER_ACCESS_TTL_SECONDS,
    audience: 'localmarket-user',
    issuer: 'localmarket-api',
  });

  const refreshToken = jwt.sign(refreshPayload, refreshSecret, {
    expiresIn: USER_REFRESH_TTL_SECONDS,
    audience: 'localmarket-user',
    issuer: 'localmarket-api',
  });

  return { accessToken, refreshToken };
}

export interface RegisterUserInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  province?: string;
  city?: string;
  area?: string;
  avatarUrl?: string;
  capabilities?: {
    buy?: boolean;
    sell?: boolean;
    offerServices?: boolean;
    hireProviders?: boolean;
  };
}

export async function registerUser(input: RegisterUserInput): Promise<UserAuthResult> {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AppError(503, 'Database unavailable.');
  }
  if (!isUserAuthConfigured()) {
    throw new AppError(503, 'Authentication service is not configured.');
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const rawPhone = input.phone?.trim() || '';
  let normalizedPhone: string | null = null;
  if (rawPhone) {
    if (!isValidPakistaniPhone(rawPhone)) {
      throw new AppError(400, 'Please enter a valid Pakistani mobile number (e.g. 0300-1234567).');
    }
    normalizedPhone = normalizePakistaniPhone(rawPhone);
  }

  const existingByEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingByEmail) {
    throw new AppError(409, 'An account with this email address already exists. Please login.');
  }

  if (normalizedPhone) {
    const existingByPhone = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (existingByPhone) {
      throw new AppError(409, 'An account with this phone number already exists. Please login.');
    }
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);
  const caps = input.capabilities ?? {
    buy: true,
    sell: false,
    offerServices: false,
    hireProviders: true,
  };

  const capabilityRows: { capability: CapabilityType; isEnabled: boolean }[] = [
    { capability: 'BUY', isEnabled: caps.buy ?? true },
    { capability: 'SELL', isEnabled: caps.sell ?? false },
    { capability: 'OFFER_SERVICES', isEnabled: caps.offerServices ?? false },
    { capability: 'HIRE_PROVIDERS', isEnabled: caps.hireProviders ?? true },
  ];

  const created = await prisma.user.create({
    data: {
      fullName: input.fullName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
      avatarUrl: input.avatarUrl || null,
      province: input.province?.trim() || 'Khyber Pakhtunkhwa',
      city: input.city?.trim() || 'Peshawar',
      area: input.area?.trim() || 'University Road',
      accountStatus: 'ACTIVE',
      lastLoginAt: new Date(),
      capabilities: {
        create: capabilityRows,
      },
    },
    include: { capabilities: true },
  });

  const tokens = issueUserTokens(created.id, created.email);
  return {
    user: mapUserRecordToDto(created),
    ...tokens,
  };
}

export async function loginUser(identifier: string, password: string): Promise<UserAuthResult> {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AppError(503, 'Database unavailable.');
  }
  if (!isUserAuthConfigured()) {
    throw new AppError(503, 'Authentication service is not configured.');
  }

  const trimmed = identifier.trim();
  const isEmail = trimmed.includes('@');
  const normalizedPhone = !isEmail ? normalizePakistaniPhone(trimmed) : '';

  const user = await prisma.user.findFirst({
    where: isEmail
      ? { email: trimmed.toLowerCase() }
      : { OR: [{ phone: normalizedPhone }, { phone: trimmed }] },
    include: { capabilities: true },
  });

  if (!user) {
    throw new AppError(401, 'Invalid email/phone or password.');
  }

  if (user.accountStatus !== 'ACTIVE') {
    throw new AppError(403, 'Your account is currently inactive or suspended.');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Invalid email/phone or password.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = issueUserTokens(user.id, user.email);
  return {
    user: mapUserRecordToDto(user),
    ...tokens,
  };
}

export async function loginDemoMarketplaceUser(): Promise<UserAuthResult> {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AppError(503, 'Database unavailable.');
  }
  if (!isUserAuthConfigured()) {
    throw new AppError(503, 'Authentication service is not configured.');
  }

  const demoEmail = 'hamza.afridi@example.pk';
  let user = await prisma.user.findUnique({
    where: { email: demoEmail },
    include: { capabilities: true },
  });

  if (!user) {
    const randomDemoHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), BCRYPT_SALT_ROUNDS);
    user = await prisma.user.create({
      data: {
        fullName: 'Hamza Afridi',
        email: demoEmail,
        phone: '0300-9123456',
        passwordHash: randomDemoHash,
        province: 'Khyber Pakhtunkhwa',
        city: 'Peshawar',
        area: 'University Road',
        accountStatus: 'ACTIVE',
        lastLoginAt: new Date(),
        capabilities: {
          create: [
            { capability: 'BUY', isEnabled: true },
            { capability: 'SELL', isEnabled: true },
            { capability: 'OFFER_SERVICES', isEnabled: true },
            { capability: 'HIRE_PROVIDERS', isEnabled: true },
          ],
        },
      },
      include: { capabilities: true },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
  }

  const tokens = issueUserTokens(user.id, user.email);
  return {
    user: mapUserRecordToDto(user),
    ...tokens,
  };
}

export async function getUserProfileById(userId: string): Promise<UserAccountDto> {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AppError(503, 'Database unavailable.');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { capabilities: true },
  });

  if (!user || user.accountStatus !== 'ACTIVE') {
    throw new AppError(401, 'User account not found or inactive.');
  }

  return mapUserRecordToDto(user);
}

export async function refreshUserSession(refreshToken: string): Promise<UserAuthResult> {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AppError(503, 'Database unavailable.');
  }

  const refreshSecret = getUserRefreshSecret();
  if (!refreshSecret) {
    throw new AppError(503, 'Authentication service is not configured.');
  }

  let decoded: UserRefreshJwtPayload;
  try {
    decoded = jwt.verify(refreshToken, refreshSecret, {
      audience: 'localmarket-user',
      issuer: 'localmarket-api',
    }) as UserRefreshJwtPayload;
  } catch {
    throw new AppError(401, 'Invalid or expired refresh session.');
  }

  if (decoded.typ !== 'user-refresh' || !decoded.sub) {
    throw new AppError(401, 'Invalid refresh token.');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    include: { capabilities: true },
  });

  if (!user || user.accountStatus !== 'ACTIVE') {
    throw new AppError(401, 'Account unavailable.');
  }

  const tokens = issueUserTokens(user.id, user.email);
  return {
    user: mapUserRecordToDto(user),
    ...tokens,
  };
}

export function verifyUserAccessToken(token: string): UserAccessJwtPayload {
  const accessSecret = getUserAccessSecret();
  if (!accessSecret) {
    throw new AppError(503, 'Authentication service is not configured.');
  }

  const decoded = jwt.verify(token, accessSecret, {
    audience: 'localmarket-user',
    issuer: 'localmarket-api',
  }) as UserAccessJwtPayload;

  if (decoded.typ !== 'user-access' || !decoded.sub) {
    throw new AppError(401, 'Invalid user access token.');
  }

  return decoded;
}
