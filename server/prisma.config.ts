// Prisma 7: CLI configuration lives here, not in schema.prisma.
// The datasource URL is resolved from DATABASE_URL (server/.env in dev,
// platform env vars on Render / GitHub Actions).
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});