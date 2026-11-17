import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  FRONTEND_URL: z.string().trim().optional().default('http://localhost:3000'),
  APP_URL: z.string().trim().optional().default(''),
  DATABASE_URL: z.string().trim().optional().default(''),
  DIRECT_URL: z.string().trim().optional().default(''),
  JWT_ACCESS_SECRET: z.string().trim().optional().default(''),
  JWT_REFRESH_SECRET: z.string().trim().optional().default(''),
  ADMIN_JWT_ACCESS_SECRET: z.string().trim().optional().default(''),
  ADMIN_JWT_REFRESH_SECRET: z.string().trim().optional().default(''),
  ADMIN_SETUP_TOKEN: z.string().trim().optional().default(''),
  INITIAL_SUPER_ADMIN_EMAIL: z.string().trim().optional().default(''),
  INITIAL_SUPER_ADMIN_PASSWORD: z.string().optional().default(''),
  INITIAL_SUPER_ADMIN_NAME: z.string().trim().optional().default(''),
  INITIAL_SUPER_ADMIN_PHONE: z.string().trim().optional().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().trim().optional().default(''),
  CLOUDINARY_API_KEY: z.string().trim().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().trim().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Failed to parse environment variables.');
}

const rawEnv = parsed.data;

const isPlaceholder = (val: string) =>
  !val || val.includes('CHANGE_ME') || val.startsWith('MY_');

const isValidPostgresUrl = (val: string) =>
  Boolean(val) &&
  !val.includes('CHANGE_ME') &&
  (val.startsWith('postgres://') || val.startsWith('postgresql://'));

const resolvedAdminAccessSecret = !isPlaceholder(rawEnv.ADMIN_JWT_ACCESS_SECRET)
  ? rawEnv.ADMIN_JWT_ACCESS_SECRET
  : !isPlaceholder(rawEnv.JWT_ACCESS_SECRET)
    ? rawEnv.JWT_ACCESS_SECRET
    : '';

const resolvedAdminRefreshSecret = !isPlaceholder(rawEnv.ADMIN_JWT_REFRESH_SECRET)
  ? rawEnv.ADMIN_JWT_REFRESH_SECRET
  : !isPlaceholder(rawEnv.JWT_REFRESH_SECRET)
    ? rawEnv.JWT_REFRESH_SECRET
    : '';

export const env = {
  ...rawEnv,
  isProduction: rawEnv.NODE_ENV === 'production',
  isDatabaseConfigured: isValidPostgresUrl(rawEnv.DATABASE_URL),
  isDirectDatabaseConfigured: isValidPostgresUrl(rawEnv.DIRECT_URL),
  isAuthConfigured:
    !isPlaceholder(rawEnv.JWT_ACCESS_SECRET) && !isPlaceholder(rawEnv.JWT_REFRESH_SECRET),
  adminAccessSecret: resolvedAdminAccessSecret,
  adminRefreshSecret: resolvedAdminRefreshSecret,
  isAdminAuthConfigured:
    resolvedAdminAccessSecret.length >= 32 && resolvedAdminRefreshSecret.length >= 32,
  isAdminSetupTokenConfigured:
    !isPlaceholder(rawEnv.ADMIN_SETUP_TOKEN) && rawEnv.ADMIN_SETUP_TOKEN.length >= 24,
  isInitialSuperAdminEnvConfigured:
    !isPlaceholder(rawEnv.INITIAL_SUPER_ADMIN_EMAIL) &&
    !isPlaceholder(rawEnv.INITIAL_SUPER_ADMIN_PASSWORD) &&
    rawEnv.INITIAL_SUPER_ADMIN_PASSWORD.length >= 12,
  isCloudinaryConfigured:
    Boolean(rawEnv.CLOUDINARY_CLOUD_NAME) &&
    Boolean(rawEnv.CLOUDINARY_API_KEY) &&
    Boolean(rawEnv.CLOUDINARY_API_SECRET),
  allowedOrigins: Array.from(
    new Set(
      [
        rawEnv.FRONTEND_URL,
        rawEnv.APP_URL,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ]
        .flatMap((origin) => origin.split(','))
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0 && !origin.startsWith('MY_'))
    )
  ),
};
