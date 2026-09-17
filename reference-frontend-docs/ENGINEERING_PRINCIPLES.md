# Engineering Principles

## 1. Separate concerns by responsibility

The reference separates shared UI, landing components, configuration, route pages, and utilities. Ugnay should extend this into feature boundaries: a page composes, a hook manages state, an API function transports data, and the backend enforces rules.

## 2. Composition beats duplication

Landing sections and Radix-based primitives are composed from smaller pieces. Ugnay should compose shadcn controls into feature forms and tables instead of creating near-identical versions for every screen.

## 3. Own code near the feature that changes it

The reference centralizes reusable marketing pieces. For Ugnay, transaction-specific schemas, hooks, API functions, and components should live under `features/transactions`; globally shared code should earn its way into `lib` or `components/ui`.

## 4. Keep server state distinct from UI state

The reference dashboard puts mock transactions, chart data, pagination, and UI controls in one component. That is acceptable for a visual mock, but risky for a real product. Ugnay should put server state in TanStack Query, URL state in search params, form state in RHF, and ephemeral state in local React state.

## 5. Make the data flow predictable

Use one direction: component -> hook -> API function -> Axios -> backend. After a write, invalidate or update known query keys. Predictability makes failures diagnosable and tests focused.

## 6. Validate at trust boundaries

Zod catches user mistakes before requests. The backend validates again because the browser is untrusted. Shared schemas can reduce drift, but frontend validation never replaces backend rules.

## 7. Type contracts, not guesses

Type request and response DTOs, permissions, query parameters, and normalized errors. Avoid using `any`; use `unknown` at transport boundaries and narrow it deliberately.

## 8. Authorization is a security concern, not a visual concern

A `PermissionGate` improves UX but can be bypassed. Every protected backend operation must check the authenticated subject, tenant, resource, and permission. Ugnay can remain permission-based without introducing role hierarchies.

## 9. Every asynchronous view has explicit states

A production feature needs pending, success, empty, error, and often refreshing states. The reference has the relevant Skeleton, Alert, and empty primitives, but does not wire them to real requests. Ugnay should make state handling part of each feature's contract.

## 10. Reuse behavior, not accidental markup

The reference's best reusable pieces encode behavior and accessibility, while the dashboard's large markup is product-specific. Reuse a table primitive; do not copy the mock dashboard wholesale.

## 11. Prefer the smallest abstraction that survives a second use

Do not add a global store, repository layer, event bus, or optimistic update framework before two concrete use cases demand it. Clear local code is preferable to speculative architecture.

## 12. Security configuration belongs near deployment

The reference centralizes headers in `next.config.js`. In Vite, CSP and HTTP headers belong in the backend, proxy, or hosting configuration. Keep API origins explicit and avoid broad policies such as `connect-src *`.

## 13. Test user-visible contracts

Test form validation, permissions, query/mutation behavior, and critical workflows. Do not spend early effort snapshotting every decorative landing section. The reference has no tests, which is a gap to correct rather than a pattern to copy.