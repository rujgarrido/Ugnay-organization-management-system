# Ugnay Gap Analysis

Ugnay is described as a React + Vite application with permission-based authorization. The reference is a static Next.js template. A difference is a gap only when it creates a real product, correctness, or maintenance risk.

| Area | Current Ugnay | Reference project | Gap | Recommended change | Complexity | Priority |
|---|---|---|---|---|---|---|
| Framework | React + Vite | Next.js App Router | Framework difference only | Keep Vite; translate boundaries with React Router. | Low | Critical |
| Routing | React Router | Folder routes and root layout | Need explicit nested layouts and fallback route | Add public/authenticated route layouts and pending auth handling. | Medium | High |
| Authentication | JWT + refresh token (provided context) | None | Ugnay owns a real session problem; reference offers no solution | Centralize Axios token/refresh behavior, session restoration, logout, and redirect policy. Prefer secure cookies where backend permits. | Medium | Critical |
| Authorization | Permission-based | None; pricing only mentions permissions | UI and backend policy must stay aligned | Model permissions as capabilities and expose `can(permission)` for UX. Enforce server-side. Do not convert to RBAC automatically. | Medium | Critical |
| API layer | Axios (provided context) | Only newsletter adapter and OG route | Need a typed, consistent transport boundary | Add one Axios instance, typed feature API functions, and normalized errors. | Low | Critical |
| Server state | TanStack Query (provided context) | Hard-coded dashboard data | Real data needs caching and invalidation | One query hook per read use case; mutation hooks invalidate exact keys. | Medium | Critical |
| Forms | RHF + Zod (provided context) | Demo-only RHF/Zod; native newsletter input | Production form conventions need to be consistent | Feature-local schemas, RHF resolver, server field-error mapping, disabled pending state. | Low | High |
| UI primitives | shadcn/ui | Radix/shadcn-like local primitives | Conceptually aligned | Reuse shadcn; do not duplicate primitives. | Low | High |
| Dashboard data | Backend-backed in Ugnay by implication | Static mock in one page | Reference cannot validate Ugnay's data architecture | Separate feature table, query, filters, and pagination. | Medium | Critical |
| Tables | Product likely needs operational tables | Native mock table; TanStack Table dependency | Need server pagination/filter semantics | Start with shadcn table; add TanStack Table for sorting/column state. | Medium | High |
| Loading/error/empty | Required for real API | Mostly absent | Blank or inconsistent states are likely | Standardize feature states and route error boundary. | Low | Critical |
| Notifications | Needed for commands | Toast primitives/demo only | Need policy for success and failure | Toast success; inline errors for forms; persistent alert for important failures. | Low | Medium |
| Testing | Not specified | No tests | Reference provides no test baseline | Add one critical flow with MSW and Testing Library; E2E auth later. | Medium | High |
| Environment | Vite requires public env conventions | No `.env.example`; only `ANALYZE` used | Deployment configuration can drift | Validate `VITE_API_URL` at startup and document safe/public variables. | Low | High |
| Security headers | Backend/hosting responsibility | Next config includes CSP and headers | Need equivalent deployment policy | Set headers at API gateway/host; keep CSP narrow and avoid broad `connect-src *`. | Medium | High |
| SSR/SEO | Product app likely authenticated | Reference invests in static metadata/SEO | No gap for authenticated screens | Add SEO only for public Ugnay pages that need indexing. | Low | LATER |

## Important Non-Gaps

- Not using Next.js is not a defect. Ugnay's backend-driven app benefits from a client router and explicit API boundary.
- Not copying the reference's landing-page component tree is not a defect. Ugnay should use shadcn and feature components for its own workflows.
- Permission-based authorization is not an inferior RBAC implementation. It is a different policy model and is appropriate when capabilities vary independently of job titles.
- Avoiding a global state library is healthy while query cache, URL state, and local state cover the requirements.