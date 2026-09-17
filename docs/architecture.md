# TaskFlow — Architecture

## Style

Modular Monolith, package-by-feature, layered responsibilities:

Route → Controller → Service → Prisma → PostgreSQL

No repository layer as a separate abstraction — Prisma's client already *is*
the data-access layer; adding a repository wrapper on top of it for a 2-week
MVP is unnecessary indirection. Services call `db.<model>.findFirst(...)`
directly (see `src/config/db.ts` for the shared client instance).

**Rule:** modules do not reach directly into another module's data access.
A `Task` service needing to check organization membership calls a shared
capability (`resolveOrgContext` middleware, or a small exported helper from
the organizations module) rather than querying `OrganizationMember` itself
from inside the tasks module. Keeps business boundaries clean without
splitting into microservices.

## Module boundaries

```
server/src/
├── features/
│   ├── auth/            — register, login, refresh, logout
│   ├── organizations/    — org CRUD, members, positions, committees
│   ├── projects/          — project CRUD
│   ├── tasks/              — task CRUD, Kanban status
│   ├── proposals/           — proposal workflow + signatures (the differentiator)
│   └── activity/             — append-only activity log + dashboard
│
├── lib/    — error classes (errors.ts), cross-module helpers
├── config/    — env.ts, db.ts (single PrismaClient instance)
├── middleware/ — authenticate, resolveOrgContext, requirePermission, errorHandler
├──tests
├──app.ts
└── index.ts

```

**Why `organizations` absorbs Members/Positions/Committees rather than each
getting a top-level module:** they're all facets of "who's in this org and
what can they do" — splitting them into separate top-level modules would
mean every permission check crosses a module boundary for no real benefit.
Committees may end up cut from MVP entirely (see backlog cut list) — if so,
the folder just stays empty/unused rather than being removed, so re-adding
it later doesn't require restructuring.

**Confirmed NOT modules for this MVP** (per requirements freeze, Section 6):
boards (Kanban is a *view* over Tasks, not a separate entity), comments,
notifications, real-time/websockets, calendar, chat.


