# 05 — Production Deployment

> This is the **production** guide — it shares nothing with local dev
> ([`01-setup-local.md`](01-setup-local.md) / [`02-running-local.md`](02-running-local.md)).

| Component | Platform | Connection |
|---|---|---|
| Database | Neon (PostgreSQL) | pooled `DATABASE_URL` (runtime) + direct `DIRECT_URL` (migrations) |
| API | Render | https://ugnay.onrender.com |
| Web | Vercel | project URL (CD secret `FRONTEND_URL`) |
| Routing | `webapp/vercel.json` rewrites | `<site>/api/*` → `https://ugnay.onrender.com/api/*` + SPA fallback |

> ⚠️ The Render URL is **hardcoded** in `webapp/vercel.json` — if the Render URL
> ever changes, update that rewrite or every API call 404s/502s.

## 1. Database — Neon

1. Create a Neon project → you get two connection strings:
   - **pooled** → becomes `DATABASE_URL` on Render
   - **direct** → becomes `DIRECT_URL` in GitHub Actions
2. Migrations are applied automatically by CD
   (`npx prisma migrate deploy` with `DIRECT_URL`). Manual run:

   ```bash
   cd server
   # PowerShell
   $env:DIRECT_URL="<neon-direct-url>"; npx prisma migrate deploy
   # bash: DIRECT_URL="<neon-direct-url>" npx prisma migrate deploy
   ```

3. The driver adapter is chosen by hostname (`*.neon.tech` → `PrismaNeon`,
   otherwise `PrismaPg`) — see `server/src/config/database.ts`.

## 2. Backend — Render

Web service settings:

| Setting | Value |
|---|---|
| Root directory | `server` |
| Build command | `npm ci && npm run build` |
| Start command | `npm start` (runs `node dist/index.js`) |
| Node version | 22 |
| Health check path | `/health` |

Environment variables (Render dashboard only — never commit):

| Var | Value | Why |
|---|---|---|
| `NODE_ENV` | `production` | **Required.** Otherwise rate limiting is bypassed and cookie `secure` flags stay off (`server/src/index.ts` logs a warning when `DATABASE_URL` is Neon but `NODE_ENV` isn't production) |
| `DATABASE_URL` | Neon **pooled** URL | runtime database |
| `JWT_SECRET` | long random value | rotating it logs everyone out |
| `JWT_EXPIRES_IN` | `1d` (optional — this is the default) | access-token lifetime |
| `CORS_ORIGIN` | `https://<vercel-url>` (comma-separated for several) | must match the frontend origin exactly, or requests fail with "Origin is not allowed by CORS" |
| `PORT` | injected by Render automatically | the app listens on `env.PORT` (default 4000) |

## 3. Frontend — Vercel

- Import the repo with **root directory `webapp`** (framework preset: Vite).
- **No API URL env var in production** — `VITE_DEV_API_TARGET` is dev-only.
  The `vercel.json` rewrite forwards `/api/*` to Render so the browser stays
  same-origin (cookies + CSRF work, no CORS needed).
- Keep the SPA fallback rewrite (`/(.*)` → `/index.html`) or deep links 404.

## 4. GitHub Actions secrets

All six CD secrets are documented in
[`04-ci-cd.md`](04-ci-cd.md#required-github-secrets).

## 5. Deploy flow

```text
push / merge to main → CI (green) → CD → migrate Neon → Render hook → Vercel hook → verify both
```

- **Automatic:** every green CI run on `main` triggers CD.
- **Manual:** Actions → **CD** → **Run workflow** (`gh workflow run CD`).
- **Platform-only redeploy (no CI):** trigger the Render/Vercel deploy hooks
  directly or use each dashboard's "Redeploy".

## 6. Post-deploy smoke test

1. `curl -s https://ugnay.onrender.com/health` → `{"status":"ok"}`
2. `curl -s -o /dev/null -w "%{http_code}" https://<vercel-url>` → `200`
3. `curl -s https://<vercel-url>/api/v1/auth/csrf` → JSON — proves the
   Vercel → Render rewrite end-to-end
4. Browser: register → login → create an organization → dashboard loads

## 7. Rollback

| Situation | Action |
|---|---|
| Bad code shipped | `git revert <sha>` and push to `main` → CI/CD redeploy |
| Render build failed / unhealthy | Render dashboard → **Deploys** → previous deploy → **Rollback** |
| Vercel bad release | Vercel dashboard → **Deployments** → promote a previous one |
| Migration failed during CD | `npx prisma migrate status` from `server/` (with `DIRECT_URL`); fix forward with a new migration — use `prisma migrate resolve` only to mark a stuck migration |

## 8. Production gotchas

- `NODE_ENV=production` on Render — rate limiting and secure cookies depend on it.
- `CORS_ORIGIN` must contain the exact Vercel origin (scheme + host, no slash).
- The Render URL in `webapp/vercel.json` must match reality.
- Pooled vs direct: **runtime = pooled**, **migrations = direct**.
- Never point your local `server/.env` at production — use platform env vars
  and the CD pipeline.
