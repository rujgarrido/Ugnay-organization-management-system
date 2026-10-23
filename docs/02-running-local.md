# 02 — Running Locally (daily loop)

Prerequisites completed: [`01-setup-local.md`](01-setup-local.md).

## Start everything

**Terminal 1 — API** (auto-reload via `tsx watch`):

```bash
cd server && npm run dev
```

**Terminal 2 — web** (Vite HMR):

```bash
cd webapp && npm run dev
```

| URL | What |
|---|---|
| http://localhost:5173 | The app |
| http://localhost:4000/health | API health → `{"status":"ok"}` |
| http://localhost:5173/api/v1/... | API through the Vite proxy (same-origin, like production) |

Request flow locally: browser → `:5173/api/*` → Vite proxy
(`VITE_DEV_API_TARGET`, default `http://localhost:4000`) → Express. Because the
browser stays on one origin, cookies and the CSRF double-submit pair behave
exactly as in production.

## Commands — `server/`

| Command | What it does |
|---|---|
| `npm run dev` | Run API with reload (tsx watch) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run the built `dist/index.js` (production-style) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `npm run lint:fix` | ESLint |
| `npm run format` | Prettier write |
| `npm test` / `npm run test:watch` | Jest (see note below) |
| `npm run prisma:generate` | Regenerate Prisma client (after schema changes) |
| `npm run prisma:migrate` | Create/apply migrations (dev) |
| `npm run prisma:studio` | DB GUI → http://localhost:5555 |
| `npm run db:seed` | Run `prisma/seed.ts` |

> **Tests:** run them from `server/` so `dotenv` picks up `server/.env` —
> `src/config/env.ts` validates `DATABASE_URL` + `JWT_SECRET` at import time and
> exits if missing. Tests mock the Prisma layer
> (`jest.mock('../config/database')`), so no live database connection is made —
> but generate the client first (`npm run prisma:generate`) so type-checking
> passes.

## Commands — `webapp/`

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on `:5173` |
| `npm run build` | `tsc -b` + `vite build` → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `npm run lint:fix` | ESLint |
| `npm run format` | Prettier write |

## Checking the local database

```bash
# Is the container up and healthy?
docker compose ps
docker compose logs postgres --tail 50

# Is Postgres accepting connections?
docker exec -it ugnay-postgres pg_isready -U taskflow

# Tables and row counts
docker exec -it ugnay-postgres psql -U taskflow -d taskflow -c '\dt'
docker exec -it ugnay-postgres psql -U taskflow -d taskflow -c 'SELECT count(*) FROM "User";'

# Prisma's view of the world (run from server/)
npx prisma migrate status    # applied vs pending migrations
npm run prisma:studio        # browser GUI → http://localhost:5555
```

Full DB operations (seed, reset, Neon vs local, migrations):
[`03-database.md`](03-database.md).

## Reset local data (destructive)

```bash
cd server
npx prisma migrate reset      # drop → re-apply migrations → seed (confirms first)

# Complete wipe including the Docker volume:
docker compose down -v && docker compose up -d
```

Never run `migrate reset` / `migrate dev` against the production Neon database.

## Logs

- API logs are Pino output on stdout (5xx → `error`, 4xx → `warn`, else `info`;
  `/health` is excluded from the access log to keep probes quiet).
- `server/err.log`, `server/out.log`, etc. are local redirect outputs —
  gitignored (`*.log`).

## Ports

```powershell
# PowerShell — what is listening on 4000?
Get-NetTCPConnection -LocalPort 4000 -State Listen
```

```bash
lsof -i :4000   # macOS / Linux
```

If a stale `tsx watch` holds the port, kill that process or restart the terminal.

## Stopping

`Ctrl+C` in both terminals. Postgres keeps running; stop it with
`docker compose stop postgres` (data persists in the `ugnay_postgres_data`
volume).
