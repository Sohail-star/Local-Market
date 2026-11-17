import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  FRONTEND_URL: z.string().trim().optional().default('http://localhost:3000'),
  APP_URL: z.string().trim().optional().default(''),
  DATABASE_URL: z.string().trim().optional().default(''),
  JWT_ACCESS_SECRET: z.string().trim().optional().default(''),
  JWT_REFRESH_SECRET: z.string().trim().optional().default(''),
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

export const env = {
  ...rawEnv,
  isProduction: rawEnv.NODE_ENV === 'production',
  isDatabaseConfigured:
    Boolean(rawEnv.DATABASE_URL) &&
    !rawEnv.DATABASE_URL.includes('CHANGE_ME') &&
    (rawEnv.DATABASE_URL.startsWith('postgres://') ||
      rawEnv.DATABASE_URL.startsWith('postgresql://')),
  isAuthConfigured:
    !isPlaceholder(rawEnv.JWT_ACCESS_SECRET) && !isPlaceholder(rawEnv.JWT_REFRESH_SECRET),
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
