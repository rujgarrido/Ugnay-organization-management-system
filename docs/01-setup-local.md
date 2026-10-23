# 01 — Local Setup (one time)

Takes a fresh clone to a running stack. The daily loop lives in
[`02-running-local.md`](02-running-local.md).

## 1. Prerequisites

| Tool | Verify |
|---|---|
| Node.js 22 LTS | `node -v` |
| npm | `npm -v` |
| Docker Desktop (running) | `docker --version` |
| Git | `git --version` |

## 2. Clone

```bash
git clone https://github.com/rujgarrido/Ugnay.git
cd Ugnay
```

## 3. Create the three environment files

```bash
cp .env.example .env                 # root  → docker-compose Postgres credentials
cp server/.env.example server/.env   # API   → DATABASE_URL, JWT, CORS, PORT
cp webapp/.env.example webapp/.env   # web   → dev proxy target (optional)
```

| File | Variables | Notes |
|---|---|---|
| `.env` | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | Consumed by `docker-compose.yml`. Keep `POSTGRES_PORT=5432` — it must match the port in `server/.env` (compose falls back to host port **5433** if unset → connection refused). |
| `server/.env` | `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN` | Required at boot: `DATABASE_URL` + `JWT_SECRET` — the API exits with a config error otherwise (`server/src/config/env.ts`). |
| `webapp/.env` | `VITE_DEV_API_TARGET` | Optional, dev-only. Defaults to `http://localhost:4000`. |

**Generate a real `JWT_SECRET`** (replace the placeholder; never commit it):

```powershell
# PowerShell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```

```bash
# bash / Git Bash
openssl rand -hex 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

All `.env` files are gitignored — only `*.env.example` is committed.

## 4. Start PostgreSQL (Docker)

```bash
docker compose up -d
docker compose ps            # expect state "running (healthy)"
docker logs ugnay-postgres   # recent startup lines, no errors
```

## 5. Install dependencies

```bash
cd server && npm ci
cd ../webapp && npm ci
```

## 6. Generate the Prisma client

```bash
cd server
npx prisma validate
npx prisma generate
```

Prisma 7's generator writes the client to `server/src/generated/prisma`
(**gitignored**). This step is required after every fresh clone and after every
schema change — typecheck, lint, tests, and build all fail without it.
`validate`/`generate` do not open a database connection.

## 7. Apply the database schema

```bash
cd server
npm run prisma:migrate      # = npx prisma migrate dev — creates/applies migrations
```

Useful first-run checks:

```bash
npx prisma migrate status   # are migrations applied? (run from server/)
npm run db:seed             # optional sample data
```

## 8. Run and verify

**Terminal 1 — API:**

```bash
cd server
npm run dev
# → "Ugnay API listening on http://localhost:4000"
```

Verify:

```bash
curl http://localhost:4000/health
# → {"status":"ok"}
```

> On PowerShell, `curl` is an alias for `Invoke-WebRequest` — use
> `Invoke-RestMethod http://localhost:4000/health` or `curl.exe ...` instead.

**Terminal 2 — web:**

```bash
cd webapp
npm run dev
```

Open **http://localhost:5173** — the Vite proxy forwards `/api/*` to `:4000`,
so no CORS configuration is needed locally.

---

Next: [`02-running-local.md`](02-running-local.md) (daily commands) ·
[`06-troubleshooting.md`](06-troubleshooting.md) (if a step failed).
