# Ugnay Migration Roadmap

This is an adoption sequence, not a rewrite plan. Preserve working Ugnay code and move one feature at a time. Ugnay's existing modular-monolith structure remains unchanged; these recommendations are applied within the current module boundaries.

## Phase 1 - Do Now

| Recommendation | Reason | Benefit | Complexity | Risk | Dependencies |
|---|---|---|---|---|---|
| Document Ugnay's existing module and presentation boundaries | Makes ownership clear without restructuring the app | Easier navigation and smaller changes | Low | Low | Existing Ugnay structure |
| Add a single typed Axios client | Centralizes base URL and auth transport | Consistent requests and errors | Low | Low | Backend contract |
| Add TanStack Query provider and query keys | Separates server state from UI state | Cache, dedupe, refetch, invalidation | Medium | Low | Axios client |
| Build the dashboard or first core MVP feature end to end inside its existing module | Proves the architecture against reality without structural churn | Reusable implementation reference for later features | Medium | Low | Query provider, backend endpoint |
| Standardize RHF + Zod + shadcn forms | Prevents inconsistent validation | Typed fields and accessible errors | Low | Low | shadcn, resolver |
| Add protected routes and session restoration | Prevents anonymous access and refresh breakage | Correct auth UX | Medium | Medium | Auth API contract |
| Add permission helper plus backend checks | Keeps permission model explicit | Better UX without false security | Medium | Medium | Permission vocabulary |
| Add loading, empty, error, and retry states | Real API calls need visible outcomes | Fewer dead ends for users | Low | Low | Query status |
| Add `.env.example` and startup validation | Prevents environment drift | Safer deployments | Low | Low | Vite env convention |

## Phase 2 - After MVP

| Recommendation | Reason | Benefit | Complexity | Risk | Dependencies |
|---|---|---|---|---|---|
| Put filters, sort, and pagination in URL params | Lists should be shareable and navigable | Back/forward and deep links work | Medium | Low | React Router |
| Add Vitest, Testing Library, and MSW | API/UI boundaries are now stable | Fast regression confidence | Medium | Low | Feature contracts |
| Add Playwright for login and one critical workflow | Browser integration catches routing/auth issues | Production-like confidence | Medium | Medium | Stable test environment |
| Add centralized error normalization and logging | Raw errors are inconsistent | Safer, more useful diagnostics | Medium | Low | Axios client |
| Add TanStack Table where table behavior warrants it | Avoid premature table complexity | Sorting/columns become maintainable | Medium | Low | Table use case |
| Add route-level code splitting within the existing route structure | Larger app bundles affect startup | Better initial load | Low | Low | Existing router |

## Phase 3 - SaaS Scaling

| Recommendation | Reason | Benefit | Complexity | Risk | Dependencies |
|---|---|---|---|---|---|
| Formalize tenant and resource permission evaluation | Multi-tenant access is security-sensitive | Consistent authorization | High | Medium | Backend policy contract |
| Add observability for API failures and auth events | User reports need context | Faster incident diagnosis | Medium | Medium | Monitoring provider |
| Generate or validate API types from an API contract | Manual DTO drift grows with teams | Safer frontend/backend changes | Medium | Medium | OpenAPI or equivalent |
| Add cache persistence only for justified offline/startup needs | Memory cache is lost on reload | Faster return visits where useful | Medium | Medium | Security review |
| Introduce optimistic updates for selected reversible actions | Latency becomes visible at scale | Faster perceived interactions | High | High | Mutation semantics and rollback tests |

## Phase 4 - Only If Needed

| Recommendation | Reason | Benefit | Complexity | Risk | Dependencies |
|---|---|---|---|---|---|
| Global client state library | Only when state cannot be URL/query/local state | Solves proven cross-cutting state | Medium | Medium | Concrete use cases |
| SSR or a framework migration | Only for public SEO/performance requirements | Server-rendered public pages | High | High | Product and deployment decision |
| Offline-first synchronization | Only when offline operation is core | Resilient field workflows | Very high | High | Conflict model and backend support |
| Broad domain service/repository abstraction | Only when multiple transports or workflows justify it | Isolates complex domain policy | High | Medium | Repeated complexity |

## Working Rule

Implement the smallest vertical slice, measure its friction, then promote only repeated solutions into shared abstractions. The reference is useful as a catalog of composition ideas, not as a mandate to build every available primitive or framework feature. For Ugnay, polish the screen inside the module that owns it; do not create a parallel frontend architecture merely to resemble the reference repository.