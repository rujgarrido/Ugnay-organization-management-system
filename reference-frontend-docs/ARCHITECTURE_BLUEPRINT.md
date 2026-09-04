# Ugnay Architecture Blueprint

## Scope and Evidence

This blueprint is derived from the repository at the time of analysis. The reference is primarily a Next.js 15 marketing/content template with a static dashboard mock, not a complete SaaS application. It contains useful UI, composition, configuration, and form-demo patterns, but it does not contain production authentication, authorization, a business API client, TanStack Query, Axios, persistence, or tests.

That distinction matters: Ugnay should extract the boundaries and engineering principles, not copy the directory names or pretend absent behavior exists. Ugnay's existing modular-monolith architecture remains the source of truth. The reference frontend is a UI and interaction-quality reference that will be applied inside Ugnay's existing modules.

## Ugnay Adaptation Rule

Do not reorganize Ugnay to match this repository. Preserve Ugnay's current modular-monolith structure, module ownership, backend boundaries, and naming conventions. When implementing an MVP feature such as the dashboard, improve the presentation layer inside the owning Ugnay module:

```text
Existing Ugnay module
  -> existing application/use-case boundary
    -> existing API or transport boundary
      -> polished Ugnay UI
        -> shadcn primitives + Tweakcn theme
```

The reference contributes visual and interaction patterns: hierarchy, spacing, responsive layout, dashboard composition, tables, filters, dialogs, status badges, loading states, empty states, and accessible controls. It does not dictate where Ugnay stores those components or how Ugnay implements its modular-monolith boundaries.

For every MVP screen, separate the work into three decisions:

1. **Architecture:** Which existing Ugnay module owns the capability?
2. **Behavior:** Which existing use case, API, query, permission, and state conventions support it?
3. **Presentation:** Which polished UI composition makes the workflow clear and efficient?

Only the third decision should be directly inspired by this reference repository.

## 1. Overall Architecture

Recommended Ugnay request flow:

```text
Route
  -> Page composition
    -> Feature component
      -> Feature hook
        -> API function
          -> Axios client
            -> Backend API
```

The layers have different jobs:

- **App and routes** own application bootstrapping, providers, route definitions, layouts, and access gates.
- **Pages** compose a screen and connect route parameters to feature components. They should not contain HTTP details.
- **Features** own a user-facing capability such as transactions, members, or billing. A feature can contain its API functions, hooks, schemas, components, types, and page fragments.
- **Hooks** adapt server state and UI state to components. TanStack Query hooks own fetching, caching, mutation status, and invalidation.
- **API functions** are small typed functions such as `getTransactions` or `createTransfer`. They know endpoint paths and request/response shapes, but not presentation.
- **Axios client** owns the base URL, credentials, request headers, token refresh policy, and normalized transport errors.
- **Backend** remains the authority for authentication, permissions, validation, and business rules.

For mutations:

```text
Form or command
  -> React Hook Form + Zod validation
    -> mutation hook
      -> typed API function
        -> backend
          -> invalidate or update relevant query keys
            -> UI reflects authoritative data
```

This is the main architecture Ugnay needs. The reference project demonstrates composition and reusable UI, but its dashboard data is hard-coded in `app/dashboard/page.tsx`, so it cannot serve as evidence for server-state design.

## 2. Recommended UI Placement Without Reorganizing Ugnay

The following is a conceptual placement guide, not a replacement folder structure:

```text
Existing Ugnay modular-monolith module
  presentation/
    pages or screens       # route-level composition
    components             # module-specific UI
    forms                  # RHF + Zod forms
    tables                 # module-specific data views
  application              # existing use cases and orchestration
  infrastructure           # existing API, persistence, and adapters
  domain                  # existing business rules and types
```

Use Ugnay's real directory names if they differ. The principle is that polished dashboard UI belongs to the module that owns the workflow, while reusable shadcn primitives and truly cross-module layout components remain shared according to Ugnay's existing conventions.

Do not create a second parallel architecture such as a new `src/features` tree if Ugnay already has module boundaries. Translate the feature-ownership principle into the current modular-monolith structure instead.

## 3. Recommended Folder Architecture for a New React + Vite App

```text
src/
  app/
    providers.tsx
    query-client.ts
    router.tsx
  components/
    ui/                    # shadcn primitives only
    layout/                # app shell, sidebar, navbar
    feedback/              # loading, empty, error, toast compositions
  features/
    auth/
      api/
      components/
      hooks/
      schemas/
      types/
    transactions/
      api/
      components/
      hooks/
      schemas/
      types/
      pages/
  hooks/                   # genuinely cross-feature hooks
  lib/
    api-client.ts
    auth-storage.ts
    query-keys.ts
    errors.ts
  routes/
    protected-route.tsx
    public-route.tsx
  services/                # only cross-feature domain services
  types/                   # shared transport and identity types
  utils/                   # small pure utilities
```

`app/` replaces the framework-owned responsibilities that Next.js provides through its root layout and App Router. `routes/` makes React Router policy explicit. `features/` gives each capability one ownership boundary, preventing a global `components`, `api`, and `types` directory from becoming a dependency maze. `components/ui` should contain shadcn primitives, not business logic. `lib` contains infrastructure that is shared but not a business feature.

Do not create every directory on day one. Start with `app`, `components/ui`, `features`, `lib`, and `routes`; add `schemas`, `types`, and `services` when a feature actually needs them.

## 4. Feature Architecture Concept

```text
features/projects/
  api/projects-api.ts
  components/project-form.tsx
  components/project-table.tsx
  hooks/use-projects.ts
  hooks/use-create-project.ts
  schemas/project-schema.ts
  types/project.ts
  pages/projects-page.tsx
```

Use this structure when a capability has more than one screen, request, or reusable UI piece. Keep a small feature flat when it has one page and one request. Feature ownership is more important than a rigid tree.

## 5. Providers and Layouts

The reference root layout centralizes metadata, global CSS, theme providers, analytics, search, and the page outlet in `app/layout.tsx`. Ugnay should keep the same idea using an explicit provider composition:

```text
BrowserRouter
  -> QueryClientProvider
    -> AuthProvider (only if auth state is truly global)
      -> ThemeProvider
        -> AppRouter
```

React Router layouts should provide shared authenticated chrome, while page components provide feature content. Avoid putting a sidebar in every page. Route layouts are a meaningful improvement over the reference dashboard's one-file shell.

## 6. State Boundaries

- **Server state:** transactions, profile, permissions, billing data. TanStack Query.
- **URL state:** filters, search, sort, pagination, selected tab. React Router search params.
- **Form state:** unsaved input and field errors. React Hook Form.
- **Ephemeral UI state:** dialog open, mobile sidebar, local view toggle. `useState`.
- **Global client state:** only cross-screen client concerns that cannot be derived from the URL or query cache. Introduce Zustand or Context only when a concrete need appears.

This corrects the reference dashboard, where server-like data, pagination, and presentation all live in one component.

## 7. Ugnay Adoption Decision

Adopt now inside the existing Ugnay modules: polished shadcn-based screens, Tweakcn theme tokens, explicit route layouts where Ugnay already supports them, typed Axios boundaries, TanStack Query for backend state, React Hook Form plus Zod for complex forms, permission checks at the UI boundary, and consistent loading/error/empty states. Defer SSR, server actions, optimistic updates, global state libraries, and elaborate service layers until a measurable requirement exists.

## MVP Dashboard Implementation Sequence

When Ugnay starts the dashboard, use this order:

1. Confirm the existing Ugnay module that owns the dashboard data and its permission requirements.
2. Preserve the existing API, application, and state boundaries; do not move them for visual reasons.
3. Define the dashboard information hierarchy: primary task, key metrics, recent activity, filters, and next actions.
4. Apply the Ugnay Tweakcn theme to shadcn primitives and create the module-specific dashboard composition.
5. Implement real loading, error, empty, disabled, and unauthorized states before polishing decorative details.
6. Connect tables, filters, pagination, and actions to the existing backend/query conventions.
7. Validate the main workflow at desktop and mobile widths and test permission-restricted actions.

The result should feel visually related to the reference frontend while remaining unmistakably Ugnay in branding, domain language, module boundaries, and behavior.