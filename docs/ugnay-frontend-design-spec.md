# Ugnay — Frontend Design Spec (Current MVP Scope)

> Use this as a prompt/brief for a design tool, a frontend design agent, or your own build reference. It is derived strictly from the Phase 4 backlog — no invented features. Committees are intentionally excluded (deferred to a future MVP). Proposal pages are marked conditional — only build if Epic 5 ships.

---

## 0. Global Requirements (apply to every page)

- **Auth state:** access token in memory only (never localStorage); silent refresh on 401 via axios interceptor.
- **Org context:** every authenticated page after login operates inside an active `orgId`. If the user belongs to 2+ orgs, an org switcher dropdown lives in the nav and re-scopes all API calls.
- **Loading states:** every async action needs a visible spinner or skeleton — no silent waits (US-7.3).
- **Error states:** every failed request shows a visible error message mapped to the error taxonomy (400 validation, 403 permission denied, 404 not found, 409 conflict) — never a silent failure (US-7.3).
- **Responsive:** basic check at mobile width required (US-7.3) — layouts should not break, even if not pixel-polished.
- **Empty states:** every list-based page (Members, Projects, Tasks, Proposals, Activity Feed) needs a defined empty state, not a blank screen.
- **Permission-aware UI:** buttons/actions the user's position doesn't permit should be hidden or disabled, not just fail silently on click.

---

## 1. Pre-Auth Pages

### 1.1 Register
- **Route:** `/register`
- **Purpose:** new account creation
- **Fields:** first name, last name, email, password
- **Behavior:** inline validation errors (Zod-backed); duplicate email shows a clear "already registered" error; success redirects to `/login`
- **Calls:** `POST /auth/register`

### 1.2 Login
- **Route:** `/login`
- **Purpose:** authenticate existing user
- **Fields:** email, password
- **Behavior:** wrong credentials show a clear inline error; success stores access token in memory and redirects to `/`
- **Calls:** `POST /auth/login`

---

## 2. Post-Login Landing & Org Setup

### 2.1 No-Org Empty State
- **Route:** `/` (conditional render, not a distinct URL)
- **Purpose:** shown when `GET /organizations/mine` returns empty
- **Content:** "Create an organization" CTA, plus guidance text: "or ask your President to add you by email"
- **Leads to:** Create Organization form

### 2.2 Create Organization (form/modal)
- **Purpose:** opened from the empty state (or from org switcher "+ New org")
- **Fields:** name, description
- **Behavior:** submits as one atomic transaction (org + default positions + creator membership); on failure, nothing is created and the form shows the error
- **Calls:** `POST /organizations`

### 2.3 Org Switcher (nav component, not a page)
- **Shown when:** user belongs to 2+ organizations
- **Behavior:** dropdown in the top nav; selecting an org re-scopes every subsequent request to that `orgId`

---

## 3. Sidebar / Main Navigation Pages

Based on the backlog, the persistent sidebar has **3 top-level groups always, a 4th conditional**. Two of these groups (Projects, Proposals) are not flat links — they expand into sub-navigation once a specific item is selected.

```
Sidebar
├── Dashboard                          (flat — no sub-nav)
├── Members                            (flat — no sub-nav)
├── Projects                           (group)
│   └── [select a project] →
│       ├── Board (Kanban)             (default sub-page)
│       ├── Overview / Details
│       └── (New Task action, not a page)
└── Proposals  *(conditional — Epic 5)* (group)
    └── [select a proposal] →
        ├── Status & Details           (default sub-page)
        └── Signatures
```

**Navigation pattern:** Dashboard and Members are single destinations. Projects and Proposals are two-level: the sidebar link opens a *list*, selecting an item opens that item's own local sub-nav (tabs or a secondary sidebar), which is where Kanban/Board lives for Projects.

### 3.1 Dashboard
- **Route:** `/dashboard`
- **Purpose:** at-a-glance org health
- **Components:**
  - 4–5 summary cards: active projects, open tasks, overdue tasks, completed tasks, pending proposals (omit last card if Epic 5 not shipped)
  - Activity feed list below/alongside the cards — "who did what, when," paginated
- **Calls:** `GET /organizations/:orgId/dashboard`, `GET /organizations/:orgId/activity?entityType=&page=`
- **Note:** this is where Activity Log surfaces in the UI — there is no separate Activity page in current scope.

### 3.2 Members
- **Route:** `/members`
- **Purpose:** manage org membership and positions
- **Components:**
  - List/table: name, email, position, active/inactive status
  - "Add member" form: email + position dropdown (adds an already-registered user immediately — no email invite system)
  - Change-position control per member
  - Deactivate button per member, with a confirmation step
- **Guardrail surfaced in UI:** last remaining admin cannot be demoted or deactivated — action should be disabled/explained, not just error on click
- **Calls:** `POST/GET/PATCH/DELETE /organizations/:orgId/members`

### 3.3 Projects — Navigation Group
- **Sidebar link route:** `/projects` → the list page below. Selecting a project drops the user into a local sub-nav scoped to that project (tabs at the top of the project workspace, e.g. "Board" / "Overview").

#### 3.3.0 Projects (list) — group landing page
- **Route:** `/projects`
- **Purpose:** browse and create projects
- **Components:**
  - Cards or table of projects (name, description, status)
  - "New project" form
  - Archived projects visually distinguished, never shown as deleted
- **Calls:** `POST/GET/PATCH /organizations/:orgId/projects`

#### 3.3.1 Board (Kanban) — sub-page, default tab
- **Route:** `/projects/:projectId/board`
- **Purpose:** the core interactive surface — this is where daily work happens
- **Components:**
  - 5 columns: Backlog / To Do / In Progress / Review / Done
  - Drag-and-drop via `@dnd-kit`
  - Task cards show title, assignee, priority
  - Drag action calls `PATCH /tasks/:id/status`
  - Board supports filter by status/assignee, paginated
  - "New task" entry point (opens the New Task form as a modal — see 3.3.3)
- **Calls:** `GET .../tasks?status=&assigneeId=&page=`, `PATCH /tasks/:id/status`

#### 3.3.2 Overview / Details — sub-page
- **Route:** `/projects/:projectId/overview`
- **Purpose:** project metadata and lifecycle management, separated from the board so the board itself stays uncluttered
- **Components:**
  - Project name, description (editable)
  - Status indicator (active/archived)
  - Archive action (never a hard delete)
- **Calls:** `GET/PATCH /organizations/:orgId/projects/:projectId`

#### 3.3.3 New Task (modal, not a routed page)
- **Triggered from:** the Board sub-page
- **Fields:** title, description, priority, assignee dropdown, due date
- **Calls:** `POST .../tasks`, `PATCH /tasks/:id`, `PATCH /tasks/:id/assignee`

### 3.4 Proposals — Navigation Group *(conditional, Epic 5 only)*
- **Sidebar link route:** `/proposals` → the list page below. Selecting a proposal drops the user into a local sub-nav scoped to that proposal (tabs, e.g. "Status" / "Signatures").

#### 3.4.0 Proposals (list) — group landing page
- **Route:** `/proposals`
- **Purpose:** browse and create proposals
- **Components:**
  - List of proposals with current status
  - "New proposal" form
- **Calls:** `POST/PATCH /organizations/:orgId/proposals`

#### 3.4.1 Status & Details — sub-page, default tab
- **Route:** `/proposals/:proposalId/status`
- **Purpose:** track and advance a proposal's lifecycle
- **Components:**
  - Current status display
  - **Only the legally valid next status shown as action buttons** — never a free status picker (prevents illegal transitions like `DRAFT → COMPLETED`)
- **Calls:** `PATCH /proposals/:id/status`

#### 3.4.2 Signatures — sub-page
- **Route:** `/proposals/:proposalId/signatures`
- **Purpose:** track sign-off from required signatories
- **Components:**
  - Signature checklist: signatory name, role, pending/complete state
  - Add-signatory action, mark-complete action
- **Calls:** `POST/PATCH .../signatures`

**Fallback version (if behind schedule):** collapse both tabs into a single page — 3 statuses only (`DRAFT`/`SUBMITTED`/`COMPLETED`), no transition buttons enforcing legality, signature list becomes read-only display, no separate Signatures tab.

---

## 4. Page Inventory Summary Table

| # | Page | Sidebar? | Type | Depends on |
|---|---|---|---|---|
| 1 | Register | No | Pre-auth | — |
| 2 | Login | No | Pre-auth | — |
| 3 | No-org empty state | No | Interstitial | Auth |
| 4 | Create Organization | No | Modal/form | Empty state or switcher |
| 5 | Dashboard | **Yes** (flat) | Main | Org context |
| 6 | Members | **Yes** (flat) | Main | Org context |
| 7 | Projects (list) | **Yes** (group landing) | Main | Org context |
| 8 | ↳ Board (Kanban) | No — project sub-nav | Sub-page | A project selected |
| 9 | ↳ Overview / Details | No — project sub-nav | Sub-page | A project selected |
| 10 | Proposals (list) | **Yes**, conditional (group landing) | Main | Epic 5 shipped |
| 11 | ↳ Status & Details | No — proposal sub-nav, conditional | Sub-page | A proposal selected |
| 12 | ↳ Signatures | No — proposal sub-nav, conditional | Sub-page | A proposal selected |

**Total routed pages: 9 core / 12 if Proposals ships.**
**Top-level sidebar entries: 3 core / 4 if Proposals ships** — 2 of those entries (Projects, Proposals) are groups that reveal a local sub-nav once an item is selected.

---

## 5. Explicit Non-Goals for This Design Pass

Do not design screens for: Committees (deferred), password reset, email verification, CSRF-related UI, refresh-token theft warnings, DB-level permission UI, or any billing/paid-tier screens. These are out of scope per the backlog and should not appear in navigation, even as disabled/greyed-out placeholders.
