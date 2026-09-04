# Ugnay — Updated Product Backlog & Sprint Plan (v2)

> This is an **amendment** to your original Phase 4 backlog, not a replacement. All original epics, stories, and checkpoints stay as written. New stories below are marked **[NEW]** and inserted into the epic they logically belong to. Nothing here is mandatory — see the updated cut list at the bottom for what to drop first if you fall behind.

**What changed and why:**
- The original spec had no page for managing the organization itself (only create + switch existed) — gap identified during design review.
- The org switcher was conditional (only shown with 2+ orgs) — upgraded to a persistent top-nav element, standard for multi-tenant SaaS.
- No account/profile page existed for a user to manage their own info.
- Project Detail and Proposal Detail were single dense pages — split into tabbed sub-navigation (Board/Overview, Status/Signatures) for clarity.

---

## SPRINT 1 (Days 1-7): Foundation — Auth, RBAC, Core Workflow

*(unchanged stories US-1.1 through US-1.5 stay exactly as originally written)*

### Epic 1 — Walking Skeleton & Auth (Days 1-3)

**US-1.6 [NEW] — Persistent top-nav org switcher (upgrade from US-1.5's conditional dropdown)**
- [ ] Top nav always shows current org name/initial, even with only 1 org
- [ ] Clicking opens a dropdown: list of user's orgs + "Create new organization" action
- [ ] Selecting an org re-scopes all subsequent requests to that `orgId`
- [ ] Replaces the "only shown if 2+ orgs" behavior from original US-1.5 — always visible
- **Effort:** Small (extends existing switcher component, no new endpoint)

**US-1.7 [NEW] — Account/Profile page**
- [ ] Route: `/account`, accessible from a user menu (avatar/name in top nav)
- [ ] Fields: first name, last name, email — editable, saves via `PATCH /users/me`
- [ ] No password-reset flow (still explicitly out of scope per original doc)
- [ ] Frontend only needs basic form + save confirmation — no new backend model
- **Effort:** Small — requires one new endpoint (`PATCH /users/me`) not in original API design; confirm it exists or add before building

---

## SPRINT 1 (Days 4-7 continued): Organization & RBAC Core

*(US-2.1 through US-2.5 stay exactly as originally written)*

### Epic 2 — Organization & RBAC Core (Days 4-6)

**US-2.6 [NEW] — Organization Settings: Profile tab**
- [ ] Route: `/organization/profile`
- [ ] Edit org name and description → `PATCH /organizations/:orgId`
- [ ] Archive/deactivate organization action (soft — never hard delete), gated behind admin permission
- [ ] Requires new sidebar entry: "Organization" (group, see nav note below)
- **Effort:** Small — mostly reuses the Create Organization form pattern in edit mode

**US-2.7 [NEW] — Organization Settings: Positions & Permissions tab**
- [ ] Route: `/organization/positions`
- [ ] List all positions in the org with their assigned permission codes (read view minimum)
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
6. **[NEW]** Positions & Permissions editing (US-2.7) → ship as read-only list, or omit the tab entirely and keep positions admin-only via direct DB access for the demo
7. **[NEW]** Organization Profile editing (US-2.6) → org name/description becomes fixed after creation; cut the whole page if needed
8. **[NEW]** Account/Profile page (US-1.7) → users keep whatever name/email they registered with; cut if `PATCH /users/me` isn't already a trivial add

**Never cut (unchanged):** Epic 6 (Testing), Epic 2's last-admin guard.

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