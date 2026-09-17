# Ugnay — API Reference

> Base path: `/api/v1`. Envelope: `{ status, message, data }` (errors use the
> same shape; Zod failures return 400 with `data: zod.flatten()`).
> Auth: `Authorization: Bearer <accessToken>` + `X-CSRF-Token` header on
> unsafe methods (double-submit against the readable `csrfToken` cookie).

## Health
`GET /health` -> `{ status: 'ok' }`

## Auth
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/auth/csrf` | - | Sets + returns `csrfToken` (safe method bootstrap) |
| POST | `/auth/register` | - | 201 `{ user }` (memberships: []); 409 duplicate email |
| POST | `/auth/login` | - | Sets refresh cookie; `data: { accessToken, user (with memberships) }` |
| POST | `/auth/logout` | cookie | Revokes refresh token; idempotent |
| POST | `/auth/refresh` | cookie | Rotates token; `data: { accessToken, user (with memberships) }` |
| GET | `/auth/me` | Bearer | `data: { user (with memberships) }` |

## Users
| Method | Path | Auth | Notes |
|---|---|---|---|
| PATCH | `/users/me` | Bearer + CSRF | 409 if email taken; `data: { user }` |

## Organizations
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/organizations/mine` | Bearer | `data: { memberships[] }` (US-1.5) |
| POST | `/organizations` | Bearer + CSRF | Atomic: org + 5 default positions + President membership + activity log (US-2.2) |
| GET | `/organizations/:orgId` | member | |
| PATCH | `/organizations/:orgId` | MANAGE_MEMBERS + CSRF | |
| DELETE | `/organizations/:orgId` | MANAGE_MEMBERS + CSRF | Soft archive -> `status: ARCHIVED` |
| GET | `/organizations/:orgId/positions` | member | With permission codes (read-only, US-2.7) |
| GET | `/organizations/:orgId/members` | member | |
| POST | `/organizations/:orgId/members` | MANAGE_MEMBERS + CSRF | Registered users only; 409 duplicate; 404 unknown email |
| PATCH | `/organizations/:orgId/members/:memberId` | MANAGE_MEMBERS + CSRF | 409 last-admin guard |
| DELETE | `/organizations/:orgId/members/:memberId` | MANAGE_MEMBERS + CSRF | Soft deactivate; 409 last-admin guard |
| GET | `/organizations/:orgId/dashboard` | member | `{ activeProjects, openTasks, overdueTasks, completedTasks }` (US-4.1) |
| GET | `/organizations/:orgId/activity?entityType=&page=` | member | Page size 5; entityType: all/organization/project/task/member (US-4.2) |

## Projects / Tasks / Proposals
(pending - Sprint 2/3)