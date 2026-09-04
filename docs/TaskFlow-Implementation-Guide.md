# Ugnay — Solo Developer Implementation Guide
### A 2-Week Agile-Inspired Roadmap (Planning → Design → Deployment)

> **How to use this document:** This is your roadmap, not your code. It tells you *what* to do, *why*, *what should exist afterward*, and *how to verify it worked*. No application code is included. When you're ready to implement a specific task, come back and ask me to walk through it — we'll do it one task at a time, verifying as we go.

> **Legend:** 🔒 = Fixed requirement (from your spec) · 💡 = Recommendation (adjust freely) · ⚠️ = Assumption (flagged, not invented silently)

---

## Table of Contents
1. Project Kickoff
2. Development Environment
3. Initial Repository Setup
4. Documentation Setup
5. Requirements → Backlog
6. Two-Week Agile Plan
7. Architecture Design
8. Database Design Process
9. API Design Process
10. Backend Implementation Order
11. Frontend Implementation Order
12. Backend + Frontend Integration
13. Testing Strategy
14. Git Workflow
15. Docker
16. CI/CD
17. Deployment
18. AWS Future Migration
19. Daily Development Checklist
20. Definition of Done
21. Final Condensed Checklist (Day 1–14)

---

## 1. Project Kickoff

**What we're building**
TaskFlow is a task/project management web app — think a lightweight Trello/Jira hybrid: projects, boards, tasks, comments, and team members, with a dashboard summarizing activity.

**Why it's valuable as a portfolio project**
It touches nearly every skill interviewers probe for in a full-stack role: relational data modeling, auth/authorization, REST API design, state management, drag-and-drop UI, testing, CI/CD, and deployment. It's also *explainable* — you can walk an interviewer through real architectural decisions (why modular monolith, why not microservices) rather than reciting a tutorial.

**Target users** 💡
Small teams or individuals (2–10 people) organizing work across a handful of projects — the same persona Trello/Asana target at the low end. ⚠️ *Assumption: no enterprise-scale, multi-tenant SaaS requirement — that would blow the two-week budget.*

**MVP scope (Must-Have for Day 14)** 💡
- User registration/login (JWT-based)
- Create/view/update/delete Projects
- Add/remove Project Members (single role: member vs. owner)
- Boards with Tasks (create/update/delete, move between statuses)
- Basic Comments on tasks
- Simple Dashboard (counts, maybe one chart)

**Explicitly excluded from MVP** 💡
- Notifications (in-app or email)
- Real-time collaboration (WebSockets)
- File attachments
- Granular role-based permissions (beyond owner/member)
- Multi-tenancy / organizations
- Recurring tasks, subtasks, dependencies

**What the final application should be capable of doing**
By Day 14: a deployed, authenticated, multi-user app where a user can register, create a project, invite a member, build a board, manage tasks via drag-and-drop, comment, and view a dashboard — all backed by tested, documented APIs and a CI/CD pipeline.

---

## 2. Development Environment

| Tool | Why you need it | Verify after install |
|---|---|---|
| **VS Code** | Primary editor; extensions for ESLint, Prisma, Docker | Open a `.ts` file, confirm IntelliSense works |
| **Node.js (LTS)** | Runs backend, frontend build tooling | `node -v` and `npm -v` return versions |
| **npm** | Package management (ships with Node) | `npm -v` works; `npm init` succeeds in a scratch folder |
| **Git** | Version control | `git --version`; `git config --global user.name/email` set |
| **GitHub account** | Remote repo hosting, Actions for CI/CD | Can create a repo and push via SSH or HTTPS |
| **Docker Desktop** | Run PostgreSQL locally in a container without installing Postgres natively; matches prod-like environment | `docker run hello-world` succeeds |
| **Postman** | Manual API testing during development, exportable collection as living docs | Create a workspace, send a request to any public API (e.g., `httpbin.org`) |
| **PostgreSQL client (optional)** 💡 | GUI to inspect DB (TablePlus, DBeaver, or `psql`) — since Docker runs the actual DB, you don't need a full local Postgres install | Connect to the Dockerized DB once it's running (Section 15) |

**Not needed:** a locally installed PostgreSQL server (Docker replaces it), Kubernetes, or cloud CLIs before deployment week.

---

## 3. Initial Repository Setup

```
TaskFlow/
├── webapp/        ← frontend (React/Vite)
├── server/        ← backend (Node/Express)
├── database/      ← SQL exports, seed scripts, ERD diagrams
├── docs/          ← all planning & design docs (Section 4)
├── docker/        ← Dockerfiles, Compose overrides
├── postman/       ← exported Postman collection
├── scripts/       ← helper scripts (db reset, seed, etc.)
├── screenshots/   ← README/demo images (fill in near the end)
├── .github/       ← GitHub Actions workflows
├── docker-compose.yml
├── .env.example
├── README.md
└── LICENSE
```

**Create immediately (Day 1):** `webapp/`, `server/`, `database/`, `docs/`, `.github/`, `README.md`, `LICENSE`, `.env.example`, `docker-compose.yml` (even if empty placeholders).

**Create later, as needed:** `docker/` (Section 15, once you have working Dockerfiles), `postman/` (once you have endpoints to export), `scripts/` (once repetitive tasks emerge), `screenshots/` (near Day 13–14, once UI exists).

**Git init & first commit**
1. `git init` at the `TaskFlow/` root (one repo for the whole monorepo — simpler for a solo dev than separate repos).
2. Create `.gitignore` covering `node_modules/`, `.env`, `dist/`, `build/`.
3. Add the skeleton folders (Git doesn't track empty folders — drop a `.gitkeep` or a placeholder `README.md` in each).
4. `git add .` → `git commit -m "chore: initial repository structure"`.
5. Create the GitHub repo, add remote, push `main`.

**Verify:** `git log` shows one commit; GitHub shows the folder structure; `.env` is *not* in the repo.

---

## 4. Documentation Setup

| Document | What belongs in it | Timing |
|---|---|---|
| `requirements.md` | Functional/non-functional requirements, explicitly tagged as 🔒 given or 💡 recommended | **Before coding** — living doc, but core version done Day 1–2 |
| `product-backlog.md` | User stories with MoSCoW tags | **Before coding**, evolves each sprint |
| `sprint-plan.md` | The 3-sprint breakdown, goals, Definition of Done per sprint | **Before coding**, updated at each sprint boundary |
| `architecture.md` | Modular monolith rationale, layer diagram, folder conventions | **Before coding** (Section 7) |
| `database.md` | ERD, entity descriptions, relationships | **Before coding**, refined once Prisma schema is final |
| `api.md` | Endpoint list, request/response shape, status codes | **Evolves during development** — start it before coding, fill in as endpoints land |
| `deployment.md` | Environments, env vars, deploy steps, rollback notes | **During Sprint 3**, finalized at deployment |

**Rule of thumb:** anything that constrains *design decisions* (requirements, architecture, database, API contracts) should be drafted before code. Anything that *records what was built* (api.md details, deployment.md) evolves alongside development.

---

## 5. Requirements → Backlog

**Process**
1. **Requirements** — write plain-language statements of what the system must do (from your prompt + explicit ⚠️ assumptions you make).
2. **User Stories** — convert each requirement into `As a [user], I want [goal], so that [benefit]`.
3. **Acceptance Criteria** — for each story, 2–5 concrete, testable conditions ("Given/When/Then" works well).
4. **Product Backlog** — the full list of stories, one per line/card, in `product-backlog.md`.
5. **MVP Prioritization** — apply MoSCoW to every story.

**Deciding MoSCoW category**
- **Must Have**: the app is not a functioning task manager without it (auth, projects, tasks, boards).
- **Should Have**: important but the app still "works" without it in a demo (comments, basic dashboard).
- **Could Have**: nice differentiators if time allows (drag-and-drop polish, charts via Recharts).
- **Won't Have (this iteration)**: explicitly out of scope — notifications, real-time sync, file uploads. Document these so reviewers/interviewers see it was a *decision*, not an oversight.

⚠️ Any story not explicitly stated in your original prompt that I add during this process will be labeled as a recommendation in `product-backlog.md`, not presented as a given requirement.

---

## 6. Two-Week Agile Plan 💡

**Sprint 1 (Days 1–5) — Foundation**
- *Goal:* Environment, repo, docs, architecture, DB schema, auth working end-to-end.
- *Features:* Project setup, User registration/login (JWT), base API skeleton.
- *User stories:* "As a user, I can register and log in."
- *Dev tasks:* Env setup, repo scaffold, Express app, Prisma + Postgres connection, auth endpoints.
- *Testing tasks:* Unit tests for auth service, Supertest for register/login endpoints.
- *Docs tasks:* requirements.md, architecture.md, database.md v1.
- *Deliverable:* A running backend where a user can register/login and receive a JWT, verified via Postman.
- *Definition of Done:* Auth endpoints tested, documented in `api.md`, committed with conventional commits.

**Sprint 2 (Days 6–10) — Core Domain**
- *Goal:* Projects, Members, Boards, Tasks — the heart of the MVP — usable via API and basic frontend.
- *Features:* CRUD for Projects/Boards/Tasks, membership, protected routes on frontend.
- *User stories:* "As a user, I can create a project and add tasks to a board."
- *Dev tasks:* Feature modules (route→service→repo) per entity; React pages for project list, board view, task CRUD; TanStack Query wiring.
- *Testing tasks:* Integration tests per feature; authorization tests (can't access others' projects).
- *Docs tasks:* api.md updated per endpoint; database.md finalized with ERD.
- *Deliverable:* A logged-in user can create a project, add a board, add/move tasks.
- *Definition of Done:* Feature complete, tested, documented, Dockerized locally.

**Sprint 3 (Days 11–14) — Polish, Comments, Dashboard, Deploy**
- *Goal:* Comments, dashboard, CI/CD, deployment, final documentation.
- *Features:* Comments on tasks, simple dashboard (Recharts), GitHub Actions pipeline, deploy to Vercel/Render/Neon.
- *Dev tasks:* Comment endpoints + UI, dashboard aggregation query + chart, CI workflow, deployment configs.
- *Testing tasks:* E2E smoke test of core flow; production sanity checks post-deploy.
- *Docs tasks:* deployment.md, README with screenshots, final api.md pass.
- *Deliverable:* Live, deployed app + working CI pipeline.
- *Definition of Done:* Deployed URL works end-to-end; pipeline green; README complete.

**Note:** the MVP (auth + projects + boards + tasks) is usable by the *end of Sprint 2*, so Sprint 3 is genuinely about polish and deployment, not scrambling to finish core features.

---

## 7. Architecture Design

**Layering per feature module**
```
Route/Controller
      ↓
   Service
      ↓
Repository/Data Access
      ↓
  PostgreSQL
```
Each feature (`users`, `projects`, `boards`, `tasks`, `comments`) gets its own folder inside `server/src/features/`, each containing its own controller, service, repository, and validation schema. This is **package-by-feature**, not package-by-layer — you won't have one giant `controllers/` folder for the whole app.

- **Controller** — parses HTTP request, calls service, shapes HTTP response. No business logic.
- **Service** — business rules, orchestration, calls one or more repositories. No knowledge of `req`/`res`.
- **Repository** — the only layer that talks to Prisma/Postgres. No business logic.

**Why this fits**
- **Solo developer:** one mental model (route→service→repo) repeated identically per feature — less context-switching than hunting across a layered folder structure.
- **Two-week project:** no network overhead, no distributed transactions, no service-mesh setup — you ship features, not infrastructure.
- **Portfolio project:** it's explainable in an interview in two sentences and demonstrates you understand *why* you didn't reach for microservices.
- **Future AWS migration:** because features are already isolated modules with clear boundaries, extracting one (e.g., `notifications`) into its own service later is a refactor, not a rewrite.

**Why not microservices** 🔒
Microservices solve organizational scaling (multiple teams, independent deploys) and technical scaling problems you don't have as a solo dev on a 2-week timeline. They'd add network latency, distributed debugging, multiple CI/CD pipelines, and service-discovery overhead — pure cost with no benefit at this stage.

---

## 8. Database Design Process

**Process**
1. **Identify entities** — nouns from your user stories: User, Project, ProjectMember, Board, Task, Comment.
2. **Attributes** — for each entity, list fields (name, type, nullable?).
3. **Primary keys** — use `id` (UUID or serial — pick one convention and stay consistent; UUID is friendlier for future distributed systems).
4. **Foreign keys** — e.g., `Task.boardId → Board.id`, `Board.projectId → Project.id`.
5. **Relationships & cardinality** — User 1:N Project (as owner), Project N:M User (via ProjectMember), Project 1:N Board, Board 1:N Task, Task 1:N Comment.
6. **Constraints** — `NOT NULL` on required fields, `UNIQUE` on `User.email`, cascade rules on delete (e.g., deleting a Board deletes its Tasks).
7. **Indexes** — foreign key columns, and any column you'll filter/sort on often (`Task.status`, `Task.boardId`).
8. **Timestamps** — `createdAt`, `updatedAt` on every table.
9. **Soft deletion** 💡 — consider `deletedAt` on `Project` and `Task` only (not every table) so users can "trash" a project without hard-deleting history; skip it for `Comment` to keep MVP scope tight. ⚠️ *This is a recommendation — hard delete is also acceptable for a 2-week MVP.*

**When to create the ERD:** immediately after step 6 above, before writing any Prisma schema — draw it (even a whiteboard/Excalidraw sketch) so relationships are validated on paper first. Store it in `docs/database.md` and/or `database/`.

**When to introduce Prisma:** *after* the ERD is settled. Prisma schema should be a translation of an already-agreed design, not a design tool itself — this avoids letting ORM syntax quietly steer your data model.

---

## 9. API Design Process

**Process per resource**
```
User Story → Requirement → Resource → Endpoint → Request →
Validation → Service → Response → Error Handling
```
Example flow (conceptually, no code yet): the story "As a user, I can create a task" implies resource `Task`, endpoint `POST /api/v1/tasks`, a request body validated with Zod, a service call to create it, a `201` response with the created resource, and defined error responses (`400` validation, `401` unauthenticated, `403` unauthorized, `404` board not found).

**Versioning** 🔒
Prefix all routes with `/api/v1`. This costs nothing now and avoids breaking clients if you ever introduce `/api/v2`.

**Documentation**
Use Swagger/OpenAPI — annotate routes (via JSDoc comments or a dedicated `openapi.yaml`) as you build each endpoint, not all at once at the end. Serve the docs at `/api/v1/docs` in development. This becomes both your `api.md` source of truth and a live artifact you can screenshot for your portfolio.

---

## 10. Backend Implementation Order

| Step | Why here | Prerequisite | Test afterward |
|---|---|---|---|
| 1. Project config | TS config, ESLint/Prettier, package.json scripts | Node installed | `npm run build` succeeds on empty project |
| 2. Express app | Base server, health check route | Step 1 | `GET /health` returns 200 |
| 3. Config management | Centralized env var loading (`.env` → typed config) | Step 2 | App fails fast on missing required env var |
| 4. DB connection | Verify Postgres reachable | Docker Postgres running | Connection log confirms success |
| 5. Prisma | Schema, migrate, generate client | Step 4, ERD done | `npx prisma studio` shows tables |
| 6. Error handling | Central error middleware, consistent error shape | Step 2 | Thrown error returns structured JSON, not a stack trace |
| 7. Validation | Zod middleware pattern | Step 6 | Invalid request returns 400 with details |
| 8. Logging | Pino/Winston, request logging | Step 2 | Logs show method/path/status per request |
| 9. Authentication | Register/login, JWT issue/verify, bcrypt hashing | Steps 5–8 | Postman: register → login → protected route with token |
| 10. Authorization | Middleware checking project membership/ownership | Step 9 | Non-member gets 403 on another user's project |
| 11. Users | Profile read/update | Step 9 | CRUD via Postman |
| 12. Projects | CRUD | Step 10 | CRUD via Postman, ownership enforced |
| 13. Project members | Invite/remove | Step 12 | Only owner can invite/remove |
| 14. Boards | CRUD, scoped to project | Step 12 | Board tied to correct project |
| 15. Tasks | CRUD, status changes | Step 14 | Tasks scoped to correct board |
| 16. Comments | CRUD on tasks | Step 15 | Comment tied to correct task/user |
| 17. Notifications | *(Should/Won't — see MoSCoW)* | — | Skip unless time remains |
| 18. Dashboard | Aggregation endpoint (counts, recent activity) | Steps 12–16 | Returns correct counts for seeded data |

**MVP cutoff:** Steps 1–15 are Must-Have. Step 16 (Comments) and 18 (Dashboard) are Should-Have. Step 17 (Notifications) is Won't-Have for this iteration.

---

## 11. Frontend Implementation Order

**Configure first, in this order:** Vite + TypeScript scaffold → Tailwind CSS → React Router → Axios instance (with base URL from env) → TanStack Query provider → React Hook Form + Zod resolver pattern → DnD Kit and Recharts (added only when their specific pages are built).

**Why this order:** routing and API/query infrastructure are cross-cutting — every page depends on them — so they're wired once, early. Form handling (RHF + Zod) is set up as a *pattern* before the first form is built, so every subsequent form follows the same convention. DnD Kit and Recharts are feature-specific and only needed once the Board and Dashboard pages exist, so they're added just-in-time.

**Page development order** 💡
1. Auth pages (Login/Register)
2. Protected route wrapper + Project list page
3. Project detail (Boards list)
4. Board detail (Tasks, drag-and-drop)
5. Task detail (Comments)
6. Dashboard

This mirrors the backend order and Sprint 2 focus — you always have a working page to demo the moment its API is ready.

---

## 12. Backend + Frontend Integration

**When:** as soon as a backend endpoint is stable and tested (don't wait for the whole backend to finish) — integrate feature-by-feature, matching Section 10/11 order.

**Covers:**
- **Axios configuration** — single instance with `baseURL` from an env var, request interceptor attaching the JWT.
- **API base URL** — never hardcode; use `VITE_API_URL` in `.env` files, different values per environment (local/prod).
- **Authentication** — store JWT (httpOnly cookie 💡 preferred over localStorage for XSS resistance; ⚠️ if you choose localStorage for simplicity, document the trade-off).
- **Protected routes** — a route wrapper checking auth state before rendering.
- **TanStack Query** — query keys per resource, mutations invalidate related queries.
- **Error handling** — a shared error boundary/toast pattern for failed requests.
- **Loading/empty states** — every list view needs a loading skeleton and an explicit "no data yet" state — small detail, disproportionately improves demo polish.

**Avoiding hardcoded URLs:** `.env.example` documents `VITE_API_URL` and `DATABASE_URL` placeholders; actual `.env` files are gitignored; Vercel/Render environment variable settings hold the real values per environment.

---

## 13. Testing Strategy

| Type | Tooling | Must Test | Can Defer |
|---|---|---|---|
| Unit | Jest | Service-layer business logic (e.g., password hashing, authorization checks) | Trivial getters/pure formatting helpers |
| Integration | Jest + Supertest | Each feature's endpoints against a test DB | Edge-case combinatorics |
| API | Postman collection | Manual smoke pass per sprint | Automated Postman/Newman in CI (nice-to-have) |
| Authentication | Supertest | Register/login success + failure paths, token expiry | Password reset flow (out of MVP) |
| Authorization | Supertest | Cross-user access denial on Projects/Boards/Tasks | Fine-grained per-field permissions |
| Validation | Jest/Supertest | Zod schemas reject malformed input | Exhaustive fuzz testing |
| End-to-end | 💡 Manual click-through, or one Playwright smoke test if time allows | Core flow: register → create project → create task → comment | Full E2E suite across all pages |

**Rule for a 2-week solo project:** every Must-Have backend feature gets integration tests before it's marked done (Section 20). Frontend testing is deprioritized in favor of manual verification, given the timeline — this is a stated trade-off, not an oversight, and worth mentioning as such in an interview.

---

## 14. Git Workflow 💡

- **`main`** — always deployable.
- **Feature branches** — `feature/auth-jwt`, `feature/task-crud`, `fix/board-delete-cascade`.
- **Naming:** `type/short-description` (`feature/`, `fix/`, `chore/`, `docs/`).
- **Conventional Commits:** `feat: add JWT login endpoint`, `fix: cascade delete tasks on board removal`, `docs: update api.md for tasks`.
- **Pull Requests:** even solo, open a PR per feature branch into `main` — gives you a changelog, a place for the CI pipeline to run, and portfolio evidence of professional workflow. Merge via squash-merge to keep `main` history clean.
- **When to commit:** at each small, working increment (a passing test, a working endpoint) — not once per day in one giant commit.
- **When to merge:** once the feature's tests pass locally and CI is green on the PR.

---

## 15. Docker

**When to introduce:** Day 1, but only for **PostgreSQL** initially (via `docker-compose.yml`) — this replaces installing Postgres natively and matches your eventual deployment environment (Neon is also Postgres). Backend/frontend Dockerfiles come later, useful mainly for local integration testing and optional container-based deploys — Render/Vercel don't strictly require them, but having a working backend Dockerfile is good portfolio evidence of containerization skill.

**Covers:**
- **Backend Dockerfile** — multi-stage build (install → build → slim runtime image); introduce around Sprint 2–3 once the backend is stable enough to containerize meaningfully.
- **Frontend Dockerfile** 💡 — optional; Vercel builds directly from Git, so a frontend Dockerfile is mainly for local parity/demo purposes, not required for deployment.
- **PostgreSQL container** — via `docker-compose.yml` from Day 1.
- **Docker Compose** — orchestrates Postgres (+ backend, once containerized) with one command (`docker compose up`).
- **Environment variables** — passed via `.env` referenced in `docker-compose.yml`, never hardcoded in the Dockerfile.
- **Volumes** — a named volume for Postgres data so restarting the container doesn't wipe your local dev data.
- **Local development** — Compose gives you a one-command, reproducible dev environment — valuable when you eventually show this project to others or resume it after a break.

**Why Docker even though deploying to Render/Vercel:** local/production parity (same Postgres version, same startup behavior) reduces "works on my machine" surprises, and it's a skill line item interviewers specifically ask about.

---

## 16. CI/CD

**When to introduce:** Sprint 3 (Days 11–12), once core features are stable — earlier introduction on a solo project mostly adds friction without payoff, since there's no team whose work you're protecting yet. 💡

**Pipeline concept**
```
Push
  ↓
Install dependencies
  ↓
TypeScript type-check
  ↓
Lint (ESLint)
  ↓
Test (Jest/Supertest)
  ↓
Build (frontend + backend)
```
Implement as a GitHub Actions workflow in `.github/workflows/ci.yml`, triggered on pushes and PRs to `main`. Keep it to this single linear pipeline — no matrix builds, no multi-environment deploy stages, no Kubernetes. A green checkmark on your PRs is the goal, not a full DevOps platform.

---

## 17. Deployment

**Order**
1. **PostgreSQL → Neon** — provision the database first; everything else depends on its connection string.
2. **Backend → Render** — deploy once Neon's `DATABASE_URL` is available; set all backend env vars in Render's dashboard.
3. **Frontend → Vercel** — deploy once the backend's live URL is known, so `VITE_API_URL` can point to it.
4. **Environment variables** — double-check nothing required is missing in either Render or Vercel (this is the most common "works locally, breaks in prod" cause).
5. **CORS** — backend must explicitly allow the deployed Vercel origin.
6. **Production testing** — repeat your core-flow smoke test (register → project → task → comment) against the live URLs.
7. **Domain configuration** — optional, only if you want a custom domain for the portfolio link.

**Test locally before deploying:** run the full stack via Docker Compose (or `npm run build && npm start` for both apps) with production-like env vars at least once — catches build-time errors that don't show up in `npm run dev`.

---

## 18. AWS Future Migration

**Target (not part of the 2-week MVP):**
- Backend → **AWS EC2**
- Database → **Amazon RDS PostgreSQL**
- Storage → **Amazon S3** (for future file-attachment feature)
- Monitoring → **CloudWatch**

**What today's decisions make this easier:**
- Using **Prisma** with standard PostgreSQL means swapping Neon's connection string for RDS's is a config change, not a data-layer rewrite.
- **Package-by-feature modular monolith** means individual features could later be peeled into separate services or Lambdas without restructuring the whole codebase.
- **Structured logging (Pino/Winston)** in JSON format is CloudWatch-ready without modification.
- **Environment-variable-driven config** (never hardcoded URLs/secrets) means the same codebase runs on Render or EC2 with only env changes.
- **Dockerized backend** means the same image that runs locally can run on EC2 (or ECS later) with minimal adaptation.

---

## 19. Daily Development Checklist (Template) 💡

Use this shape for each of the 14 days — filled in per Section 21.

- **Main objective:** the single most important outcome for the day
- **Tasks:** 3–5 concrete tasks
- **Expected output:** what should exist/run by end of day
- **Testing:** what you verified today
- **Git activity:** branches/commits/PRs opened or merged
- **Documentation activity:** which `docs/*.md` file you updated

---

## 20. Definition of Done (Project-Wide) 🔒

A feature is **not done** until:
- [ ] Implementation complete and matches the acceptance criteria
- [ ] Input validation implemented (Zod)
- [ ] Error handling implemented (consistent error shape, correct status codes)
- [ ] Security reviewed (auth required where needed, authorization enforced, no secrets committed)
- [ ] Unit/integration tests written and passing
- [ ] Endpoint documented in `api.md` / Swagger
- [ ] Self-reviewed (or, since solo, re-read with fresh eyes / a short checklist pass)
- [ ] Relevant `docs/*.md` updated
- [ ] Committed with a Conventional Commit message on a feature branch, merged via PR

---

## 21. Final Condensed Checklist (Day 1 → Day 14) 💡

**DAY 1 — Kickoff & Environment**
□ Install/verify all tools (Section 2)
□ Create GitHub repo, init Git, first commit (Section 3)
□ Draft `requirements.md` v1 with explicit assumptions flagged
□ Set up `docker-compose.yml` for PostgreSQL only, verify it runs

**DAY 2 — Docs & Backlog**
□ Write `product-backlog.md` with MoSCoW-tagged user stories
□ Write `sprint-plan.md` (3-sprint breakdown)
□ Draft `architecture.md` (layering, package-by-feature rationale)
□ Sketch ERD for core entities

**DAY 3 — Architecture & DB Design**
□ Finalize ERD, relationships, constraints, indexes
□ Write `database.md`
□ Scaffold `server/` project (TS config, ESLint/Prettier, Express skeleton)
□ `GET /health` working

**DAY 4 — Backend Foundations**
□ Config management, DB connection, Prisma schema from ERD
□ Central error handling + validation middleware pattern
□ Logging configured
□ `npx prisma studio` confirms schema

**DAY 5 — Authentication (Sprint 1 close)**
□ Register/login endpoints, JWT issue/verify, bcrypt hashing
□ Auth unit + integration tests passing
□ `api.md` updated for auth endpoints
□ Sprint 1 review against Definition of Done

**DAY 6 — Users, Projects backend**
□ User profile endpoints
□ Project CRUD + ownership authorization
□ Integration tests for both
□ Scaffold `webapp/` (Vite, TS, Tailwind, Router, Axios, TanStack Query)

**DAY 7 — Members, Boards backend + Auth pages frontend**
□ Project member invite/remove endpoints + authorization tests
□ Board CRUD scoped to project
□ Frontend: Login/Register pages wired to backend

**DAY 8 — Tasks backend + Project list frontend**
□ Task CRUD + status changes
□ Integration tests for tasks
□ Frontend: protected routes, Project list page

**DAY 9 — Frontend: Boards & Tasks**
□ Project detail (boards list) page
□ Board detail page with tasks
□ DnD Kit integrated for task status changes

**DAY 10 — Integration pass (Sprint 2 close)**
□ Full manual click-through: register → project → board → task
□ Fix integration bugs
□ Sprint 2 review against Definition of Done

**DAY 11 — Comments + CI**
□ Comment endpoints + tests
□ Frontend: comments on task detail
□ Set up GitHub Actions CI pipeline (Section 16)

**DAY 12 — Dashboard + Docker**
□ Dashboard aggregation endpoint + tests
□ Frontend dashboard page with Recharts
□ Backend Dockerfile written and tested locally

**DAY 13 — Deployment**
□ Provision Neon PostgreSQL, run migrations
□ Deploy backend to Render, set env vars, verify CORS
□ Deploy frontend to Vercel, set `VITE_API_URL`
□ Production smoke test of core flow

**DAY 14 — Polish & Wrap-up**
□ Finalize `README.md` with screenshots
□ Finalize `deployment.md`
□ Final `api.md`/Swagger pass
□ Tag a release (`v1.0.0`), confirm CI green, confirm live URL works end-to-end

---

*When you're ready to start Day 1, tell me and we'll begin with the single first task — verified before we move to the next.*
