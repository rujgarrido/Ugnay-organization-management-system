
# Ugnay - Multi-tenant Organization Management System

Ugnay is a modern organization management platform designed for student organizations and future NGO use. It provides centralized member management, committees, projects, tasks, proposals, dashboards, and permission-based access control using PERN stack and applied Software Development Lifecycle practices.

## Stack

- **Frontend:** React, Vite, Tailwind CSS, Shadcn/ui
- **Backend:** Node.js, TypeScript, Express, PostgreSQL, Prisma, JWT, Jest
- **Infra:** Docker, GitHub Actions

## Repository layout

```
Ugnay/
├── webapp/        # React + Vite frontend
├── server/        # Express + TypeScript backend
├── database/      # ERD, seed scripts, SQL exports
├── docs/          # Requirements, architecture, API, deployment docs
├── docker/        # Dockerfiles
├── postman/       # Exported Postman collection
├── scripts/       # Dev helper scripts
├── screenshots/   # README/demo images
├── .github/       # CI workflows
└── docker-compose.yml
```

## Getting started (local development)

### Prerequisites
- Node.js LTS
- Docker Desktop
- Git

### 1. Clone and configure environment

```bash
git clone <your-repo-url>
cd Ugnay
cp .env.example .env
cp server/.env.example server/.env
cp webapp/.env.example webapp/.env
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Install dependencies

```bash
cd server && npm install
cd ../webapp && npm install
```

### 4. Generate the Prisma client and migrate

```bash
cd server
npx prisma generate
npx prisma migrate dev
```

### 5. Run the backend

```bash
cd server
npm run dev
```

Visit `http://localhost:4000/health` — should return `{"status":"ok"}`.

### 6. Run the frontend

```bash
cd webapp
npm run dev
```

Visit `http://localhost:5173`.

## Documentation

Start with **[`docs/00-overview.md`](docs/00-overview.md)** — index for the full set:

| Doc | Covers |
|---|---|
| [01 — Local setup](docs/01-setup-local.md) | Fresh clone → running stack (env files, Docker, Prisma, first run) |
| [02 — Running locally](docs/02-running-local.md) | Daily dev loop: run, test, lint, typecheck, build, DB checks |
| [03 — Database](docs/03-database.md) | Check / migrate / seed / reset commands + schema design |
| [04 — CI/CD](docs/04-ci-cd.md) | Pipelines, GitHub secrets, trigger & verify commands |
| [05 — Production](docs/05-deploy-production.md) | Neon + Render + Vercel deploy, env vars, smoke test, rollback |
| [06 — Troubleshooting](docs/06-troubleshooting.md) | Common failures → cause → fix |

Reference: [`docs/api.md`](docs/api.md) · [`docs/architecture.md`](docs/architecture.md) · [`docs/requirements.md`](docs/requirements.md)

## License

MIT License

Developed by: Rujonht Garrido

Copyright (c) 2026 Ugnay

