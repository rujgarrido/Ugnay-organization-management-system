# 04 — CI / CD

Two GitHub Actions workflows live in `.github/workflows/`:

| File | Workflow `name:` | Purpose |
|---|---|---|
| `ci.yml` | `CI` | Verify every push / pull request to `main` |
| `cd.yml` | `CD` | Deploy `main` to production after CI succeeds |

> ⚠️ CD triggers on `workflow_run` of the workflow **named `CI`** — if you
> rename either `name:`, update the other file too.

---

## CI — `.github/workflows/ci.yml`

**Triggers:** `push` and `pull_request` targeting `main`.
**Runner:** `ubuntu-latest`, Node **22**, npm cache keyed on each package's
`package-lock.json`.

### Job: `server` (working-directory `server/`)

| # | Step | Command | Notes |
|---|---|---|---|
| 1 | Install | `npm ci` | `DATABASE_URL` dummy provided (Prisma config loads it) |
| 2 | Validate schema | `npx prisma validate` | dummy URL — no connection |
| 3 | Generate client | `npx prisma generate` | dummy URL — client → `src/generated/prisma` |
| 4 | Typecheck | `npm run typecheck` | |
| 5 | Lint | `npm run lint` | |
| 6 | Test | `npm test` | gets `secrets.DATABASE_URL` + job-level `JWT_SECRET` |
| 7 | Build | `npm run build` | dummy URL |

Why the dummies:
- `server/prisma.config.ts` reads `DATABASE_URL` when the config loads — a
  syntactically valid throwaway URL (`postgresql://ci:ci@localhost:5432/ci`)
  satisfies validate/generate/build, which never connect.
- `server/src/config/env.ts` validates env at import time, so the test step
  must receive `JWT_SECRET` and `DATABASE_URL`. (Tests **mock** Prisma via
  `jest.mock('../config/database')` — no live DB is touched.)

### Job: `webapp` (working-directory `webapp/`)

```text
npm ci → npm run typecheck → npm run lint → npm run build
```

No environment variables needed.

### Replicate CI locally (same commands, same order)

```bash
# Server
cd server
npm ci
npx prisma validate
npx prisma generate
npm run typecheck
npm run lint
npm test                 # reads server/.env (DATABASE_URL + JWT_SECRET)
npm run build

# Webapp
cd ../webapp
npm ci
npm run typecheck
npm run lint
npm run build
```

If `server/.env` doesn't exist and you only need validate/generate/build:

```bash
# bash
export DATABASE_URL=postgresql://ci:ci@localhost:5432/ci
export JWT_SECRET=ci-placeholder-secret
# PowerShell equivalents:
# $env:DATABASE_URL="postgresql://ci:ci@localhost:5432/ci"
# $env:JWT_SECRET="ci-placeholder-secret"
```

### Check CI status

```bash
gh run list --workflow CI --limit 5     # recent runs
gh run view <run-id> --log-failed       # logs of failed steps only
```

Or: GitHub → **Actions** tab → **CI**. PR checks must be green before merging;
a red CI run on `main` blocks CD.

---

## CD — `.github/workflows/cd.yml`

**Triggers:**
- `workflow_run` — automatically after a **successful** `CI` run on `main`
- `workflow_dispatch` — manually from the Actions tab / `gh workflow run CD`

**Guards:** concurrency group `cd-production` (never two deploys at once,
`cancel-in-progress: false`), `timeout-minutes: 30`, and it only runs when the
CI run concluded `success` on branch `main` (or on manual dispatch).

### Pipeline steps

```text
1. Apply Prisma migrations to Neon   npx prisma migrate deploy   (env: secrets.DIRECT_URL)
2. Deploy backend to Render          POST secrets.RENDER_DEPLOY_HOOK
3. Deploy frontend to Vercel         POST secrets.VERCEL_DEPLOY_HOOK
4. Verify Render                     poll GET $RENDER_APP_URL/health  (≤10 min) → must contain "status":"ok"
5. Verify Vercel                     poll GET $FRONTEND_URL           (≤10 min) → must return 200
```

Notes:
- Deploy hooks return **202** while the platform keeps building — that means
  "accepted", not "live". Steps 4–5 are the real verification.
- Verification proves the services are **up**, not that the new commit is live.
- No seeding and no automatic rollback happen in CD
  (rollback: [`05-deploy-production.md`](05-deploy-production.md)).

### Required GitHub secrets

Set at: GitHub → repo → **Settings → Secrets and variables → Actions**.

| Secret | Used for |
|---|---|
| `DATABASE_URL` | Neon **pooled** URL (available to the workflow / test env) |
| `DIRECT_URL` | Neon **direct** URL — `prisma migrate deploy` (migrations can't run over the pooled endpoint) |
| `RENDER_DEPLOY_HOOK` | Render deploy hook URL — POST triggers a backend build |
| `VERCEL_DEPLOY_HOOK` | Vercel deploy hook URL — POST triggers a frontend build |
| `RENDER_APP_URL` | e.g. `https://ugnay.onrender.com` — health verification target |
| `FRONTEND_URL` | e.g. `https://<project>.vercel.app` — verification target |

If `RENDER_APP_URL` / `FRONTEND_URL` are unset, the verification steps are
skipped (they don't fail the deploy).

### Trigger CD manually

```bash
gh workflow run CD          # or: Actions tab → CD → Run workflow
gh run list --workflow CD --limit 3
```

### Verify production yourself

```bash
curl -s https://ugnay.onrender.com/health           # → {"status":"ok"}
curl -s -o /dev/null -w "%{http_code}\n" https://<vercel-url>            # → 200
curl -s https://<vercel-url>/api/v1/auth/csrf       # → JSON (proves Vercel → Render rewrite)
```

---

## Local equivalent of the CD migration step

```bash
cd server
npx prisma validate
npx prisma migrate deploy        # only safe if DATABASE_URL points at a real, migrated DB
```

Deploy hooks and verification are platform-side — locally you just run
`npm run dev` ([`02-running-local.md`](02-running-local.md)).
