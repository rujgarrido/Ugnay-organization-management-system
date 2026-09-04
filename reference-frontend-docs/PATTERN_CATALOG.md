# Pattern Catalog

The reference implementation is a static Next.js site. “Absent” means the repository provides no production evidence for the pattern. Demo files are labeled as demos and should not be treated as production architecture.

| # | Pattern | Problem and why it exists | Reference implementation | React + Vite implementation | Ugnay | Priority |
|---|---|---|---|---|---|---|
| 01 | Root provider composition | Shared concerns otherwise get duplicated. | `app/layout.tsx` composes theme, analytics, search, CSS, and outlet. | Compose `BrowserRouter`, `QueryClientProvider`, auth, and theme providers in `src/app/providers.tsx`. | YES | Critical |
| 02 | Feature composition | Large pages become hard to change when responsibilities are mixed. | `components/landing` groups CTA, pricing, FAQ, testimonial, and navigation pieces. | Organize by business feature; pages compose feature components. | YES | High |
| 03 | Config-driven content | Navigation and pricing variations should not require markup rewrites. | `data/config`, `pricingData`, footer links, and search links. | Keep stable labels and route metadata in typed config; do not hide permissions in config. | YES | Medium |
| 04 | Shadcn/Radix primitives | Accessibility and interaction behavior are expensive to rebuild. | `components/shared/ui` wraps Radix controls with Tailwind and CVA. | Keep shadcn in `components/ui`; compose it into domain components. | YES | High |
| 05 | Accessible form composition | Labels, errors, and IDs must remain connected. | `components/shared/ui/form.tsx` integrates `Controller`, labels, descriptions, and messages. | Use the same shadcn form pattern with RHF and `zodResolver`. | YES | High |
| 06 | Schema validation | Client input needs immediate feedback and typed values. | RHF/Zod appears in `demo/form-examples`; production newsletter uses only native email validation. | Put schemas beside features; validate client and server independently. | YES | Critical |
| 07 | Local UI state | Small interactions do not need global infrastructure. | Dashboard owns sidebar, chart period, and page state; pricing owns frequency state. | `useState` for dialogs, tabs, and responsive UI. | YES | High |
| 08 | Server state cache | Repeated requests need deduplication, stale handling, and refetch policy. | Absent. Dashboard data is hard-coded. | TanStack Query query hooks with stable keys and explicit stale policies. | YES | Critical |
| 09 | Mutation invalidation | Writes must make other views authoritative. | Absent. | Mutation hooks call API functions, then invalidate or update affected query keys. | YES | Critical |
| 10 | API adapter boundary | Components should not know transport details. | Newsletter route delegates to `NewsletterAPI`; no business API client exists. | Axios instance plus typed feature API functions. | YES | Critical |
| 11 | URL-driven filtering and pagination | Lists must be shareable and survive navigation. | Dashboard pagination is local array slicing; filter controls are inert. | Store search, filters, sort, and page in search params; query key includes them. | YES | High |
| 12 | Reusable table primitives | Tables need consistent semantics and responsive behavior. | Native table in dashboard; reusable `table.tsx` and TanStack Table dependency exist. | Use shadcn table plus TanStack Table when sorting/columns become complex. | YES | High |
| 13 | Dialog and modal composition | Destructive or multi-step actions need focus management. | Radix dialog, alert-dialog, drawer, sheet primitives exist; no business workflow is wired. | Compose dialogs inside feature components; keep mutation in hooks. | YES | High |
| 14 | Notifications | Users need confirmation without losing context. | Toast primitives and Sonner are installed; demo form uses `toast`. | Centralize success/error toast policy; never use toast as the only error surface. | YES | Medium |
| 15 | Loading, empty, and error states | Async screens need explicit states, not blank space. | Skeleton and command-empty primitives exist, but no route loading/error boundaries or real data states exist. | Add feature-specific state components and route-level error boundaries. | YES | Critical |
| 16 | Authentication/session restoration | Browser reload must recover identity safely. | Absent. | Prefer secure backend cookie strategy; otherwise short-lived memory access token plus carefully designed refresh flow. | YES | Critical |
| 17 | Protected routes | UI must not expose authenticated screens to anonymous users. | Absent; `/dashboard` is public. | React Router guard checks session state, handles pending restoration, then redirects. | YES | Critical |
| 18 | Permission-based authorization | Users may have capability differences within a tenant. | Pricing copy mentions permissions, but no checks exist. | `can(permission)` helper for UX plus backend enforcement on every protected operation. | YES | Critical |
| 19 | Optimistic updates | High-latency simple actions can feel immediate. | Absent. | Add only for reversible, well-understood actions; rollback on failure. | LATER | Medium |
| 20 | Global client state | Some state spans unrelated screens. | Absent; state is local. | Avoid by default; use URL/query cache first, then Context or a small store for proven needs. | YES, minimally | Medium |
| 21 | Error normalization | HTTP, validation, auth, and network failures need predictable UX. | Absent in app code; Next defaults handle uncaught failures. | Axios interceptor maps errors to a typed `AppError`; feature decides presentation. | YES | Critical |
| 22 | Testing layers | Confidence must match change risk. | No test script or test files. | Vitest, Testing Library, MSW, and Playwright incrementally. | YES | High |

## Key Tradeoffs

Feature folders improve ownership but can duplicate small utilities. Query caching reduces network work but requires disciplined query keys. Permission-aware UI improves clarity but is not security; the backend remains authoritative. Optimistic updates improve perceived speed but create rollback and concurrency complexity. Start with the simpler side of each tradeoff.