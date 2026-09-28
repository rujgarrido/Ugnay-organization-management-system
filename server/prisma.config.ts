// Prisma 7: CLI configuration lives here, not in schema.prisma.
// The datasource URL is resolved from DATABASE_URL (server/.env in dev,
// platform env vars on Render / GitHub Actions).
//
// Note: generate/validate do NOT connect to the DB — they only need a
// syntactically valid URL to satisfy the config loader. So when the var is
// absent (fresh clone, CI install step), fall back to a dummy URL instead of
// throwing. Runtime still enforces the real value strictly in
// src/config/env.ts and src/config/database.ts.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const DUMMY_URL = 'postgresql://ci:ci@localhost:5432/ci';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // `||` not `??` — also fall back when the var is set but empty
    // (Actions renders an unset secret as '').
    url: process.env.DATABASE_URL || DUMMY_URL,
  },
});