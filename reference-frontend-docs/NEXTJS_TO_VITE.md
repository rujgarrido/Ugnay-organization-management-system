# Next.js to React + Vite Translation

Only patterns actually evidenced in this repository are mapped below. Where the reference has no implementation, the row is marked absent rather than presented as a discovered pattern.

| Reference pattern | Next.js implementation | Ugnay translation | Decision |
|---|---|---|---|
| Application shell | `app/layout.tsx` owns HTML, metadata, providers, CSS, and outlet. | `src/main.tsx` mounts `App`; `src/app/providers.tsx` composes providers; React Router layouts own shell UI. | Use concept, not API |
| Routing | Folders under `app/` define App Router routes. | `createBrowserRouter` route objects and nested layout routes. | Replace |
| 404 | `app/not-found.tsx`. | A `path: '*'` React Router route. | Replace |
| Metadata and SEO | Next `Metadata` export and `app/seo.tsx`; static route metadata. | `react-helmet-async` only if needed, plus Vite `index.html` and backend/CDN strategy. | Assess product need |
| Client component boundary | `'use client'` on interactive pages/components such as dashboard and pricing. | Not needed; Vite client code is already browser code. | Remove |
| Server Components | Not materially used in this repository beyond the framework default. | No equivalent is required. | Do not add |
| Server Actions | No server actions found. | Mutation API functions calling the backend through Axios. | Replace |
| API route | `app/api/newsletter/route.ts` delegates to Shipixen `NewsletterAPI`; `app/api/og/route.tsx` generates an image. | Backend service owns application endpoints. Vite calls it; static assets remain in `public`. | Replace for business API |
| Layout navigation | Header/footer are reusable components and are manually composed by pages. | Shared public and authenticated React Router layouts. | Improve |
| Theme | `next-themes` through `ThemeProviders`. | `next-themes` is not needed; use a small theme provider or class toggle. | Replace |
| Search | `SearchProvider` uses Next router navigation and configured links. | Context plus React Router `navigate`, or route-aware command palette. | Translate |
| Static content | Pages such as pricing, terms, and FAQ render hard-coded/config-driven content. | Same React components and typed config can be used in Vite. | Reuse concept |
| Forms | Production newsletter uses native form validation; RHF/Zod is demonstrated under `demo/form-examples`. | RHF + Zod for Ugnay forms, with server error mapping. | Adopt |
| Data fetching | No business fetching, query cache, or Axios found. | Axios API client plus TanStack Query hooks. | Design new |
| Authentication | No auth, session, middleware, or cookies found. | Auth provider/session hook, protected route, and backend-enforced permissions. | Design new |
| Security headers | `next.config.js` emits CSP and other headers. | Configure headers in the backend, reverse proxy, or hosting platform. | Move server-side |
| Images | `next/image` and Next remote patterns. | Native `img`, Vite asset imports, or an image CDN; optimize at build/CDN layer. | Replace |
| Build | `next build`, app-info generation, Next bundle analyzer. | `vite build`, TypeScript check, ESLint, and optional Vite analyzer. | Replace |
| Error boundaries | No custom error boundary files found. | Add React error boundary around app shell and feature routes. | Improve |

## Translation Rule

Translate ownership, not syntax. A Next layout becomes a React Router layout; a Next API route becomes a backend endpoint; a server action becomes a mutation hook plus API function; a server-state decision remains a TanStack Query decision regardless of rendering framework.