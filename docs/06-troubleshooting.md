# 06 — Troubleshooting

## Local development

| Symptom | Cause | Fix |
|---|---|---|
| API exits at boot: `❌ Invalid environment configuration` | Missing/malformed `DATABASE_URL` or `JWT_SECRET` | Create `server/.env` from the example and set a real `JWT_SECRET` — [`01-setup-local.md`](01-setup-local.md) §3 |
| `ECONNREFUSED localhost:5432` / Prisma `P1001` | Postgres not running, **or** root `.env` lost `POSTGRES_PORT=5432` (compose then maps host port **5433**) | `docker compose up -d`; confirm `POSTGRES_PORT=5432` in root `.env`; check `docker compose ps` |
| `Cannot find module '../generated/prisma/client'` or Prisma type errors in typecheck | Client not generated (fresh clone / schema change) | `cd server && npx prisma generate` |
| Prisma CLI errors about `DATABASE_URL` / config | Command run outside `server/` (`dotenv` resolves relative to cwd) | `cd server` first, or pass `DATABASE_URL` explicitly |
| Browser: `Origin is not allowed by CORS` | Origin missing from `CORS_ORIGIN` | Add the exact origin (e.g. `http://localhost:5173`), comma-separated, in `server/.env` → restart API |
| 401/403 on POST/PATCH/DELETE | Missing CSRF double-submit | `GET /api/v1/auth/csrf` first, then send `X-CSRF-Token` header with the cookie — [`api.md`](api.md) |
| Tests fail at import with env errors | Ran outside `server/` or `server/.env` missing | `cd server && npm test` with `server/.env` present |
| Tests fail: `../generated/prisma/client` not found | Prisma client not generated | `cd server && npx prisma generate` |
| Frontend dev server can't reach API | Backend not running or `VITE_DEV_API_TARGET` wrong | Start API on `:4000`, or fix `webapp/.env` |

## CI / CD

| Symptom | Cause | Fix |
|---|---|---|
| CI fails on `npx prisma validate` / `generate` | `DATABASE_URL` missing in that environment | CI sets a dummy URL — when replicating locally export one ([`04-ci-cd.md`](04-ci-cd.md)) |
| CI webapp job fails on build | TypeScript errors in `webapp/` | Run `npm run typecheck` locally first |
| CD didn't run after a push | CI didn't succeed, or the push wasn't on `main` | CD requires a successful `CI` run on `main`; trigger manually: `gh workflow run CD` |
| CD step "Verify Render" times out (10 min) | Render build failed, wrong env vars, or service crash-looping | Read Render **Logs** (build + deploy), check `DATABASE_URL`/`JWT_SECRET`/`NODE_ENV`, then re-run CD |
| CD step "Verify Vercel" fails | Build error or `FRONTEND_URL` secret wrong | Check Vercel build logs; confirm the secret URL returns 200 |
| CD step 1 fails on `migrate deploy` | Migration error or `DIRECT_URL` wrong/pooled | `cd server && npx prisma migrate status` with `DIRECT_URL` set; see rollback notes in [`05-deploy-production.md`](05-deploy-production.md) |

## Production

| Symptom | Cause | Fix |
|---|---|---|
| Webapp refresh → 404 on Vercel | SPA fallback rewrite missing | Keep `/(.*) → /index.html` in `webapp/vercel.json` |
| Webapp `/api/*` → 502 / 404 | Render URL changed or service down | Update the rewrite destination in `vercel.json`; check `https://ugnay.onrender.com/health` |
| CORS errors only in production | `CORS_ORIGIN` on Render doesn't match the Vercel origin | Set the exact origin (comma-separated if several) → redeploy |
| Cookies not sent / login loops in production | `NODE_ENV` not `production` on Render (`secure` cookie flag off, rate limiting bypassed) | Set `NODE_ENV=production` — the API logs a warning otherwise |
| Rate limiting seems disabled | Same as above | Set `NODE_ENV=production` on Render |
| Tables missing on Neon | Migrations never applied | Run CD (step 1) or `npx prisma migrate deploy` with `DIRECT_URL` |

## Ports / processes

| Symptom | Fix |
|---|---|
| `EADDRINUSE :4000` | Find the holder: `Get-NetTCPConnection -LocalPort 4000 -State Listen` (PowerShell) / `lsof -i :4000` → kill the stale `tsx watch`/node process |
| `EADDRINUSE :5173` | Same for the Vite process, or run `npm run dev` with `-- --port 5174` |
| Docker won't start the DB (port already allocated) | Another Postgres holds 5432 — stop it, or change `POSTGRES_PORT` **and** `DATABASE_URL` together |

Still stuck? Check the API logs (Pino on stdout — 5xx logged at `error`,
4xx at `warn`, `/health` excluded), then
[`docs/api.md`](api.md) and [`03-database.md`](03-database.md).
