# 00 — Project Overview

Ugnay is a multi-tenant organization management platform for student organizations
(future: NGOs): members, positions with permissions, committees, projects, tasks,
proposals with signatories, and activity dashboards.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS 4, shadcn/ui, TanStack Query, React Router 6 |
| Backend | Node.js 22, TypeScript 5.5, Express 4, Zod validation, JWT (access + rotating refresh), Helmet, CORS, rate limiting, Pino logging |
| Database | PostgreSQL 16 (local via Docker) / Neon (production), Prisma 7 |
| Testing | Jest + ts-jest + Supertest (server) |
| Infra | Docker Compose, GitHub Actions (CI/CD), Render (API), Vercel (web) |

## Repository layout

```text
Ugnay/
├── webapp/            # React + Vite frontend
├── server/            # Express + TypeScript + Prisma backend
├── database/          # ERD, seed scripts, SQL exports
├── docs/              # This documentation set
├── docker/            # Dockerfiles (placeholder — Postgres runs from root compose file)
├── postman/           # Postman collection (placeholder)
├── scripts/           # Dev helper scripts (placeholder)
├── screenshots/       # README/demo images
├── .github/workflows/ # ci.yml + cd.yml
└── docker-compose.yml # Local PostgreSQL only
```

## Architecture (summary)

Modular monolith, package-by-feature. Request path:

```text
Route → Controller → Service → Prisma → PostgreSQL
```

Backend features live in `server/src/features/` (auth, users, organizations,
projects, proposals). There is no repository layer — services call the shared
Prisma client from `server/src/config/database.ts` directly. Modules never reach
into another module's data access; they use shared middleware
(`resolveOrgContext`, `requirePermission`).

Full rationale: [`architecture.md`](architecture.md).

## Environments

| | Local development | Production |
|---|---|---|
| Frontend | Vite dev server `http://localhost:5173` | Vercel (static build + rewrites) |
| Backend | Express via `tsx watch` on `http://localhost:4000` | Render web service |
| Database | PostgreSQL 16 in Docker (container `ugnay-postgres`) | Neon (pooled URL at runtime, direct URL for migrations) |
| API routing | Vite proxy: browser calls `:5173/api/*` → `:4000` | Vercel rewrite: `<site>/api/*` → Render `/api/*` |

The browser always calls the **same origin** (`/api/v1/...`) — no API host is
hardcoded in app code, so cookies + CSRF behave identically in dev and prod.

## Ports & URLs

| Service | Local | Production |
|---|---|---|
| Frontend | http://localhost:5173 | Vercel project URL (stored in the `FRONTEND_URL` CD secret) |
| Backend | http://localhost:4000 | https://ugnay.onrender.com |
| API base | http://localhost:5173/api/v1 | `https://<site>/api/v1` |
| Health check | http://localhost:4000/health → `{"status":"ok"}` | https://ugnay.onrender.com/health |
| PostgreSQL | `localhost:5432` (host) → container `:5432` | Neon host (pooled) |

> ⚠️ `webapp/vercel.json` hardcodes the Render destination URL — if the Render
> URL ever changes, update that rewrite too.

## Documentation index

Read in this order for onboarding:

| # | Document | Covers |
|---|---|---|
| 00 | [`00-overview.md`](00-overview.md) | This file — stack, layout, environments, ports |
| 01 | [`01-setup-local.md`](01-setup-local.md) | One-time local setup: clone → env → DB → install → migrate → first run |
| 02 | [`02-running-local.md`](02-running-local.md) | Daily dev loop: run, test, lint, typecheck, build, health checks |
| 03 | [`03-database.md`](03-database.md) | DB operations (check, migrate, seed, reset) + design (entities, ERD, relationships) |
| 04 | [`04-ci-cd.md`](04-ci-cd.md) | CI & CD pipelines: what runs, secrets, how to check and trigger them |
| 05 | [`05-deploy-production.md`](05-deploy-production.md) | Production: Neon + Render + Vercel setup, env vars, smoke test, rollback |
| 06 | [`06-troubleshooting.md`](06-troubleshooting.md) | Common failures → cause → fix |

Reference docs: [`api.md`](api.md) · [`architecture.md`](architecture.md) ·
[`authenticationApi.md`](authenticationApi.md) · [`requirements.md`](requirements.md) ·
[`product-backlog.md`](product-backlog.md) · [`sprint-backlog.md`](sprint-backlog.md) ·
[`ugnay-frontend-design-spec.md`](ugnay-frontend-design-spec.md) ·
[`Ugnay-Implementation-Guide.md`](Ugnay-Implementation-Guide.md) ·
[`deployment.md`](deployment.md) (stub → points to 04/05).

## Toolchain

| Tool | Version | Verify |
|---|---|---|
| Node.js | 22 (what CI uses; any active LTS works) | `node -v` |
| npm | 10+ (ships with Node) | `npm -v` |
| Docker Desktop | any recent (must be running) | `docker --version` && `docker compose version` |
| Git | any recent | `git --version` |
| GitHub CLI (optional) | for the CI/CD commands in doc 04 | `gh --version` |
