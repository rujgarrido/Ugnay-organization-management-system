// config/database.ts
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

// Prisma 7 emits the client into src/generated/prisma (see schema.prisma
// generator block) — import it from there, not from '@prisma/client'.

// Interactive transactions over the Neon serverless driver need a WebSocket
// implementation on Node < 22 (Render runs Node 22+, but CI may run older).
neonConfig.webSocketConstructor = ws;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  // Neon's HTTP/WebSocket driver only works against *.neon.tech endpoints —
  // pointed at a vanilla Postgres (local docker-compose, Render private DB)
  // it rejects with a non-Error value, which surfaces as the generic
  // "Non-error value thrown" 500. Pick the adapter from the host instead.
  const host = new URL(connectionString).hostname;
  const isNeon = host.endsWith('.neon.tech');

  const adapter = isNeon
    ? new PrismaNeon({ connectionString })
    : new PrismaPg(connectionString);

  return new PrismaClient({ adapter });
}

// Singleton: prevents exhausting DB connections when hot-reload (tsx watch)
// re-imports this module on every file change in dev.
export const prisma = global.__prisma ?? createPrisma();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}