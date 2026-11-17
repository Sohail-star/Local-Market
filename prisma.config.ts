import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const fallbackBuildUrl = 'postgresql://postgres:postgres@localhost:5432/localmarket?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL?.trim() || fallbackBuildUrl,
  },
});
