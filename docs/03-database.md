# 03 — Database (operations + design)

> **Design status:** complete — reflects the schema already migrated via
> `npx prisma migrate dev --name init`. See `server/prisma/schema.prisma`
> for the authoritative source; this doc is the human-readable companion.
>
> **Contents:** [Part 1 — Operations](#part-1--operations-commands) ·
> [Part 2 — Design](#part-2--design)

## Part 1 — Operations (commands)

> ▶ **Run every Prisma command from `server/`** — `server/prisma.config.ts`
> resolves `DATABASE_URL` from `server/.env` via `dotenv`, which reads relative
> to the current working directory.

### Where each environment connects

| Environment | Database | URL variable | Consumed by |
|---|---|---|---|
| Local | PostgreSQL 16 in Docker (container `ugnay-postgres`, host `localhost:5432`) | `DATABASE_URL` in `server/.env` | dev API, Prisma Studio |
| Production runtime | Neon — **pooled** connection string | `DATABASE_URL` (Render env var) | API at runtime |
| Production migrations | Neon — **direct** connection string | `DIRECT_URL` (GitHub Actions secret) | `npx prisma migrate deploy` in CD |

Driver adapter selection (`server/src/config/database.ts`): a hostname ending in
`.neon.tech` → `PrismaNeon` (HTTP/WebSocket), anything else → `PrismaPg`.
Pointing a non-Neon URL at the Neon adapter fails with a generic
"Non-error value thrown" 500.

### Check the database

```bash
# Local container status and logs
docker compose ps
docker compose logs postgres --tail 50

# Is Postgres accepting connections?
docker exec -it ugnay-postgres pg_isready -U taskflow

# List tables / count rows
docker exec -it ugnay-postgres psql -U taskflow -d taskflow -c '\dt'
docker exec -it ugnay-postgres psql -U taskflow -d taskflow -c 'SELECT count(*) FROM "User";'

# Prisma's view of the world (run from server/)
npx prisma validate         # schema + config valid (no DB connection)
npx prisma migrate status   # applied vs pending migrations
npm run prisma:studio       # GUI -> http://localhost:5555
```

`GET /health` only proves the API process is up — it does **not** query the
database.

### Generate the Prisma client

```bash
cd server
npm run prisma:generate     # = npx prisma generate
```

Prisma 7's `prisma-client` generator emits the client into
`server/src/generated/prisma` (**gitignored**). Required after a fresh clone
and after every schema change; typecheck/lint/test/build all depend on it.
`generate` and `validate` never open a database connection.

### Migrations

```bash
cd server

npx prisma migrate dev --name <change_name>   # DEV: create + apply (interactive)
npx prisma migrate status                     # applied / pending / failed?
npx prisma validate                           # sanity check (no connection)
npm run prisma:migrate                        # = npx prisma migrate dev (no name)

npx prisma migrate deploy                     # PROD: apply committed migrations only
```

- **Dev change flow:** edit `server/prisma/schema.prisma` →
  `npx prisma migrate dev --name <change_name>` → commit the new folder under
  `server/prisma/migrations/`.
- **Production:** only the CD workflow runs `migrate deploy` with `DIRECT_URL`
  (see [`04-ci-cd.md`](04-ci-cd.md)). Manual escape hatch: export that URL and
  run `npx prisma migrate deploy` from `server/`.

### Seed

```bash
cd server
npm run db:seed            # = tsx prisma/seed.ts
```

### Reset (destructive — local only)

```bash
cd server
npx prisma migrate reset   # drop -> re-apply all migrations -> seed (confirms first)

# Complete wipe including the Docker volume:
docker compose down -v && docker compose up -d
```

Never run `migrate reset` or `migrate dev` against Neon production.

### Port gotcha

`docker-compose.yml` maps host port `${POSTGRES_PORT:-5433}`, while
`server/.env.example` points `DATABASE_URL` at `localhost:5432`. Keep
`POSTGRES_PORT=5432` in the root `.env` (as in `.env.example`); if the variable
is unset the host port becomes 5433 and the API fails to connect →
[`06-troubleshooting.md`](06-troubleshooting.md).

## Part 2 — Design

### Entities

| Entity | Purpose |
|---|---|
| `User` | A global account — one person, can belong to multiple organizations |
| `RefreshToken` | One row per issued refresh session; rotated on use, enables real logout/revocation |
| `Organization` | A student org — the top-level tenant everything else belongs to |
| `OrganizationMember` | A user's membership in one specific org, with exactly one `Position` |
| `Position` | An org-defined role label (President, Secretary, etc.) — a bundle of permissions, not hardcoded |
| `Permission` | A global, system-defined capability code (e.g. `CREATE_TASK`) — never org-specific |
| `PositionPermission` | Join table: which permissions a given Position grants |
| `Committee` | A sub-team within an org (e.g. Logistics Committee) |
| `CommitteeMember` | Join table: which org members belong to which committees, and who's Head |
| `Project` | A body of work an org is organizing (e.g. "Foundation Day 2026") |
| `Task` | A single unit of work inside a project, tracked on the Kanban board |
| `Proposal` | An event proposal moving through the tracked approval workflow |
| `ProposalSignature` | One required signatory on a proposal, tracked `PENDING`/`COMPLETED` |
| `ActivityLog` | Append-only record of significant actions across an org |

### ERD

Full field-level diagram generated from `schema.prisma` — see the ERD rendered
earlier in this conversation (mermaid `erDiagram`, all 14 tables with fields
and keys). To regenerate it yourself later: paste `schema.prisma`'s models
into a mermaid `erDiagram` block, or run `npx prisma-erd-generator` if added
as a dev dependency.

### Relationships & Cardinality

| Relationship | Cardinality | Notes |
|---|---|---|
| User → RefreshToken | 1 — N | One user can have many active/expired sessions |
| User → OrganizationMember | 1 — N | One user, memberships in many orgs |
| Organization → OrganizationMember | 1 — N | |
| Organization → Position | 1 — N | Positions are org-scoped, not global |
| Position → OrganizationMember | 1 — N | A member has exactly **one** primary Position (MVP constraint) |
| Position ↔ Permission | N — N (via `PositionPermission`) | A position can grant many permissions; a permission can belong to many positions across different orgs |
| Organization → Committee | 1 — N | |
| OrganizationMember ↔ Committee | N — N (via `CommitteeMember`) | A member can belong to multiple committees; a committee has multiple members. `isHead` flag lives on the join row, not a separate table |
| Organization → Project | 1 — N | |
| Project → Task | 1 — N | A task belongs to exactly one project |
| OrganizationMember → Task | 1 — N (nullable) | One member can be assignee on many tasks; a task has at most one assignee — **not** many-to-many (single-assignee constraint, MVP decision) |
| Organization → Proposal | 1 — N | |
| Project → Proposal | 1 — N (optional) | A proposal may or may not belong to a project |
| Proposal → ProposalSignature | 1 — N | |
| Organization → ActivityLog | 1 — N | |

**Deliberately NOT modeled** (decisions made during Phase 3, not oversights):
- No `ProjectMember` join table — project access resolves from org membership + `visibility` field, not explicit membership rows.
- No `CommitteePermission` table — Committee Head is an ownership/scope check in the service layer, not a second permission-granting relationship.
- `Task.assigneeId` is a single nullable FK, not a many-to-many join — multiple assignees per task is out of MVP scope.