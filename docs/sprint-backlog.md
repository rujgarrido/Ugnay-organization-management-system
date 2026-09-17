# Ugnay — Updated Product Backlog & Sprint Plan (v2)

> This is an **amendment** to your original Phase 4 backlog, not a replacement. All original epics, stories, and checkpoints stay as written. New stories below are marked **[NEW]** and inserted into the epic they logically belong to. Nothing here is mandatory — see the updated cut list at the bottom for what to drop first if you fall behind.

**What changed and why:**
- The original spec had no page for managing the organization itself (only create + switch existed) — gap identified during design review.
- The org switcher was conditional (only shown with 2+ orgs) — upgraded to a persistent top-nav element, standard for multi-tenant SaaS.
- No account/profile page existed for a user to manage their own info.
- Project Detail and Proposal Detail were single dense pages — split into tabbed sub-navigation (Board/Overview, Status/Signatures) for clarity.

---

## SPRINT 1 (Days 1-7): Foundation — Auth, RBAC, Core Workflow

**US-1.1 — Repo scaffold and deploy pipeline**
As a developer, I want both repos deployed empty-but-real to Vercel/Render/Neon, so that I discover platform/CORS/cookie problems on day 1, not day 9.
- [ ] `server/` deployed to Render, responds on a health-check route
- [ ] `webapp/` deployed to Vercel, loads a blank page that successfully calls the health-check route
- [ ] Neon `DATABASE_URL` uses the **pooled** connection string (`-pooler` in hostname) — Gap #5
- [ ] GitHub Actions runs lint + a placeholder test on every push
- [ ] `helmet.js` added to Express (one line, sets security headers) — 5 min, do it now while you're in `app.ts` anyway
- [ ] **Done means:** you can open the Vercel URL right now and see it talk to Render talk to Neon

**US-1.5 — No-org empty state**
As a user with zero orgs (every new signup), I want a clear next step, not a blank screen.
- [x] Post-login: if `GET /organizations/mine` is empty, show a single screen: "Create an organization" (form → US-2.2) or "ask your President to add you by email" (matches US-2.5's actual mechanism)
- [x] If a user belongs to 2+ orgs, a simple dropdown/switcher in the nav sets the active `orgId` for all subsequent requests — doesn't need to be fancy, just needs to exist

**US-1.2 — User registration**
As a new user, I want to register with email/password, so that I have an account.
- [x] `POST /auth/register` — Zod validation, bcrypt hash, `User` row created
- [x] Duplicate email returns 409 `User already exists`, not a 500 (amended: 409 CONFLICT is the correct semantic, kept over the originally speced 400)
- [ ] No email verification step (Gap #3 — cut for MVP, explicit decision)

**US-1.3 — Login issues both tokens correctly**
As a registered user, I want to log in and stay logged in, so that I don't re-auth every 15 minutes.
- [x] `POST /auth/login` returns access JWT (userId only, 15 min) in response body
- [x] Refresh token issued as httpOnly, Secure, SameSite=None cookie; hashed row written to `RefreshToken`
- [ ] **Test cross-domain cookie delivery against your actual deployed Vercel+Render URLs right now** — this is Gap #4. If it fails, switch to the in-memory fallback today.

**US-1.4 — Refresh and logout**
As a logged-in user, I want my session to renew silently and end cleanly on logout.
- [x] `POST /auth/refresh` validates cookie against `RefreshToken`, rotates (revoke old, issue new)
- [x] `POST /auth/logout` revokes the current `RefreshToken` row
- [ ] Expired/revoked refresh token → 401 `UNAUTHENTICATED`, frontend redirects to login

---

### Epic 1 — Walking Skeleton & Auth (Days 1-3)

**US-1.6 [NEW] — Persistent top-nav org switcher (upgrade from US-1.5's conditional dropdown)**
- [x] Top nav always shows current org name/initial, even with only 1 org
- [x] Clicking opens a dropdown: list of user's orgs + "Create new organization" action
- [x] Selecting an org re-scopes all subsequent requests to that `orgId`
- [x] Replaces the "only shown if 2+ orgs" behavior from original US-1.5 — always visible
- **Effort:** Small (extends existing switcher component, no new endpoint)

**US-1.7 [NEW] — Account/Profile page**
- [x] Route: `/account`, accessible from a user menu (avatar/name in top nav)
- [x] Fields: first name, last name, email — editable, saves via `PATCH /users/me`
- [ ] No password-reset flow (still explicitly out of scope per original doc)
- [ ] Frontend only needs basic form + save confirmation — no new backend model
- **Effort:** Small — requires one new endpoint (`PATCH /users/me`) not in original API design; confirm it exists or add before building

---

## SPRINT 1 (Days 4-7 continued): Organization & RBAC Core

*(US-2.1 through US-2.5 stay exactly as originally written)*

### Epic 2 — Organization & RBAC Core (Days 4-6)

**US-2.6 [NEW] — Organization Settings: Profile tab**
- [x] Route: `/organization/profile`
- [x] Edit org name and description → `PATCH /organizations/:orgId`
- [x] Archive/deactivate organization action (soft — never hard delete), gated behind admin permission
- [ ] Requires new sidebar entry: "Organization" (group, see nav note below)
- **Effort:** Small — mostly reuses the Create Organization form pattern in edit mode

**US-2.7 [NEW] — Organization Settings: Positions & Permissions tab**
- [x] Route: `/organization/positions`
- [x] List all positions in the org with their assigned permission codes (read view minimum)
- [ ] Stretch: allow creating custom positions / toggling permission codes per position (only if ahead of schedule — the 12 seeded codes and default positions may be sufficient for MVP)
- [ ] Gated behind admin permission
- **Effort:** Medium if editable, Small if read-only — **recommend read-only for MVP**, since editable permission management is a meaningful scope increase not present in the original API design doc

🔴 **Checkpoint note:** US-2.6/2.7 should not block the original Day 7 checkpoint. If Members CRUD (original US-2.5) is at risk, cut 2.6/2.7 first — they're additive polish, not core workflow.

---

## SPRINT 2 (Days 8-14): Core Product — Projects, Tasks, Dashboard

*(US-3.1, US-3.2 stay as originally written; US-3.3 is restructured below, not new scope — same backend, reorganized frontend)*

### Epic 3 — Projects, Tasks, Kanban (Days 8-11)

**US-3.3 [UPDATED] — Kanban board becomes "Board" sub-page under Project**
- [ ] `GET .../tasks?status=&assigneeId=&page=` — unchanged from original
- [ ] `PATCH /tasks/:id/status` — unchanged from original
- [ ] Frontend: board now lives at `/projects/:projectId/board` (tab) instead of being the whole Project Detail page
- [ ] Frontend: new `/projects/:projectId/overview` tab holds project metadata (name, description, archive) — previously bundled into the same page as the board
- [ ] Breadcrumb added: `Projects / [Project Name] / Board`
- **Note:** this is a reorganization of already-scoped work, not new backend effort — safe to do without threatening the Day 14 checkpoint.

(Scope A update 2026-09-15: dashboard counts + activity feed backend `GET /:orgId/dashboard|activity` and real `dashboard-api.ts` are DONE; `mock-dashboard-data.ts` is dead code pending deletion after re-smoke. US-4.3 below is still TO DO.)

*(US-4.1, US-4.2 — Activity Log & Dashboard — stay exactly as originally written, unchanged)*

🔴 **Checkpoint — end of Day 14: unchanged from original.** Org → project → task → drag across board → dashboard. Tab restructuring should not add risk since it touches layout, not logic.

---

## SPRINT 3 (Days 15-21): Differentiator, Testing, Ship

### Epic 5 — Proposal Tracking (Days 15-17) — only if Day 14 checkpoint passed

**US-5.2 [UPDATED] — Status transitions become "Status & Details" tab**
- [ ] `PATCH /proposals/:id/status` calls `assertValidTransition()` — unchanged
- [ ] Frontend: lives at `/proposals/:proposalId/status`
- [ ] Only legal next-status buttons shown — unchanged behavior, new route

**US-5.3 [UPDATED] — Signature tracking becomes its own "Signatures" tab**
- [ ] `POST/PATCH .../signatures` — unchanged
- [ ] Frontend: lives at `/proposals/:proposalId/signatures`, separate from status tab

**Fallback (unchanged from original):** collapse both tabs back into one page — `DRAFT`/`SUBMITTED`/`COMPLETED` only, read-only signatures, no transition enforcement.

*(Epic 6 — Testing, and Epic 7 — Polish & Deployment, stay exactly as originally written. Add one line to US-7.3's scope: verify breadcrumb and tab navigation don't break on mobile width.)*

---

## Updated Cut List (in order, if you fall behind)

Original cut order is preserved; new items are inserted at the *bottom*, since they are the newest and least load-bearing additions:

1. Committees — deferred entirely *(unchanged)*
2. Proposal signature enforcement → read-only fallback *(unchanged)*
3. Dashboard → static counts only, skip filtering *(unchanged)*
4. Frontend polish (US-7.3) → functional-but-ugly is acceptable *(unchanged)*
5. Rate limiting → document as a known follow-up *(unchanged)*
6. **[NEW]** Positions & Permissions editing (US-2.7) → ship as read-only list, or omit the tab entirely and keep positions admin-only via direct DB access for the demo *(Scope A: KEPT as read-only — `GET /:orgId/positions` + read-only tab shipped)*
7. **[NEW]** Organization Profile editing (US-2.6) → org name/description becomes fixed after creation; cut the whole page if needed *(Scope A: KEPT — `PATCH /:orgId` + edit form + soft archive shipped)*
8. **[NEW]** Account/Profile page (US-1.7) → users keep whatever name/email they registered with; cut if `PATCH /users/me` isn't already a trivial add *(Scope A: KEPT — `PATCH /users/me` + account form shipped)*

**Never cut (unchanged):** Epic 6 (Testing), Epic 2's last-admin guard.

---

## Implementation Status — Scope A (2026-09-15)

Branch: `feat/frontend` (uncommitted working tree; `main` is still auth-only).

### ✅ Done

| Item | Evidence |
|---|---|
| US-1.2 register + 409 amended | `auth.service.ts:17`, tests `register.test.ts` |
| US-1.3/1.4 login, refresh rotation, logout, `GET /auth/csrf` | `auth.routes.ts:15,18–21`, `auth.controller.ts:15,35,74` |
| FLAG-1 `GET /auth/csrf` added | route + `issueCsrfToken` (`csrf.ts:27`) |
| FLAG-3 `getCurrentUser` reads `req.user.id` | `auth.controller.ts:97–102` |
| FLAG-4 repository deleted, service→Prisma | `auth.repository.ts` deleted; `auth.service.ts:8–11` |
| US-2.2 atomic org create (org + 5 positions + President + activity) | `organization.service.ts` `$transaction`; migration `20260915140445_add_organization_status` (FLAG-8 option A) |
| US-2.3 archive → `ARCHIVED`, US-2.6 profile edit | `organization.service.ts:97–164` + Profile page danger-zone card |
| US-2.7 positions read-only | `GET /:orgId/positions` + read-only tab (cut-list item 6 KEPT as read-only) |
| US-2.4/2.5 members + last-admin guard, registered-users-only | `member.service.ts` + `requirePermission('MANAGE_MEMBERS')`; `MembersPage` copy matches (FLAG-6 deferred) |
| FLAG-5 `resolveOrgContext` + `requirePermission` | `middleware/resolveOrgContext.ts`, `requirePermission.ts`, wired in `organization.routes.ts` |
| US-4.1/4.2 dashboard counts + activity feed (page size 5) | `activity.service.ts`, `dashboard-api.ts` real calls; Step 6 smoke passed |
| US-1.5/1.6 empty state + persistent switcher | `DashboardPage.tsx:45` + `ActiveOrgProvider`; `GET /mine` exists |
| US-1.7 `PATCH /users/me` + account form | `users.routes.ts` (unique-email 409); `account-api.ts` real |
| FLAG-10 axios refresh via `api.post` (inherits CSRF header) | `webapp/src/lib/axios.ts:38` |
| `docs/api.md` updated; tests 13/13 pass; `typecheck` clean (server + webapp) | Step 6 verification |

### 🛠 Still Needs Fix

| # | Item | Location |
|---|---|---|
| FLAG-11 | Activity `entityType` casing: writers use lowercase (`organization.service.ts`, `member.service.ts`), filter matches raw, schema comment says `Task`/`Proposal` capitalized — future project/task rows risk being unfilterable | `activity.service.ts:65–68` |
| FLAG-12 | Archived orgs still listed: `listUserMemberships` filters `isActive` only, not `organization.status`; archived org stays selectable | `memberships.ts:98–106` → recommend excluding `ARCHIVED` there |
| — | `validate.ts:18` logs every request body via `console.log` — must go before any deploy | `server/src/middleware/validate.ts:18` |
| — | `ProjectsPage.tsx:92` stray `` `r`n `` literal renders as text | webapp `ProjectsPage.tsx:92` |
| — | Board assignee filter matches on name-string — member rename orphans buckets; real fix is `assigneeId` filter when backend exposes it | `task-board.tsx:82–85` |
| — | Proposals tabs have no backend and no declared mock boundary (projects at least documents its contract in `projects-api.ts:15–30`) | `proposals-api.ts` |
| — | Zero tests for org/members/dashboard (Epic 6 = never cut): add create-atomic + last-admin-guard tests | `server/src/tests/` |

### 📋 To Do (next)

1. Epic 3: `server/src/features/projects/` backend (project CRUD + task CRUD + `PATCH /tasks/:id/status` + `resolveProjectContext`) reusing the `authenticate → resolveOrgContext → requirePermission` chain; swap `projects-api.ts` mock bodies for real calls; delete `mock-projects-data.ts`.
2. Epic 5: proposals backend (or document contract + keep mock boundary explicit).
3. US-1.1: deploy pipeline — Render + Vercel + pooled Neon `DATABASE_URL` + Actions (Gap #4 cross-domain cookie test, Gap #5 pooler).
4. Epic 6: org/dashboard tests; Epic 7: polish + mobile-width tab check.
5. Delete dead `mock-dashboard-data.ts` after re-smoke; final smoke; commit on `feat/frontend`.

---

## Updated Sidebar / Navigation Summary

```
Top Nav (persistent)
└── Org Switcher  [NEW — always visible]
└── Account menu → Account/Profile page  [NEW]

Sidebar
├── Dashboard
├── Projects (group)
│   └── [project] → Board | Overview
├── Members
├── Organization  [NEW group]
│   └── Profile | Positions & Permissions
└── Proposals (group, conditional — Epic 5)
    └── [proposal] → Status & Details | Signatures
```

**Total routed pages: 12 core / 15 if Proposals ships** (up from 9/12 — the increase is entirely additive polish, not new backend complexity, except `PATCH /users/me` which should be confirmed against your API design doc before Sprint 1 starts).