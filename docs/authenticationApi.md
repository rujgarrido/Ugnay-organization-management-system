# Ugnay Auth API — Manual Testing Guide (Postman)

Base URL (local): `http://localhost:<PORT>/api/v1/auth`
Replace `<PORT>` with whatever your backend's `.env` defines.

## 0. One-time Postman setup

- **Cookie jar is automatic** — as long as every request in this guide hits the *same* host/port, Postman stores and resends cookies for you. No manual copying needed.
- Check stored cookies anytime via the **Cookies** link near the URL bar.
- If testing over plain `http://localhost`, confirm your backend's cookie config allows this locally (`secure: true` cookies require HTTPS — some setups use an environment-conditional cookie config for local dev vs. production).
- Set a Postman environment variable, e.g. `{{baseUrl}} = http://localhost:4000/api/v1/auth`, so requests below can use `{{baseUrl}}/register` etc.

---

## 1. Register — `POST {{baseUrl}}/register`

**Body (JSON):**
```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test1@example.com",
  "password": "SomeStrongPass123",
  "confirmPassword": "SomeStrongPass123"
}
```

**Expected — success:**
- Status `201`
- Body: `{ "status": 201, "message": "User registered successfully", "data": { "id": ..., "firstName": ..., "lastName": ..., "email": ... } }`

**Edge cases to test:**
| Scenario | How | Expected |
|---|---|---|
| Duplicate email | Re-run the exact same request | `409`, `"User already exists"` |
| Missing/invalid fields | Remove `email`, or send an invalid email format | `400`, Zod validation error details |
| Mismatched passwords | `password` ≠ `confirmPassword` (if validated) | `400` validation error |

---

## 2. Login — `POST {{baseUrl}}/login`

**Body (JSON):**
```json
{
  "email": "test1@example.com",
  "password": "SomeStrongPass123"
}
```

**Expected — success:**
- Status `200`
- Body: `{ "status": 200, "message": "Logged in successfully", "data": { "accessToken": "<jwt>" } }`
- **Check the Cookies tab** on the response — a `refreshToken` cookie should now be present, and a `csrfToken` cookie alongside it. Both are `HttpOnly`, `SameSite=Lax`, host-only (no `Domain`), and `Secure` only in production, so neither shows up in `document.cookie` on a real frontend. The `csrfToken` value to send as `X-CSRF-Token` comes from the `GET /auth/csrf` response body.

**Edge cases to test:**
| Scenario | How | Expected |
|---|---|---|
| Wrong password | Correct email, wrong password | `401`, `"Invalid email or password"` |
| Unknown email | Email not registered | `401`, `"Invalid email or password"` (same message — confirms no user enumeration) |
| Spam / repeated login | Send the same login request several times quickly | Each call currently succeeds and issues a new refresh token row — flag this as the rate-limiting gap to add later |

**Copy the `accessToken` value from the response** — you'll need it for any future protected-route testing (paste into the `Authorization: Bearer <token>` header manually in Postman, since there's no frontend here to attach it automatically).

---

## 3. Logout — `POST {{baseUrl}}/logout`

No body needed. Relies entirely on the `refreshToken` cookie Postman is already holding from step 2.

**Expected — success:**
- Status `200`, generic success message
- Check the Cookies tab: `refreshToken` should be cleared (if `res.clearCookie` is implemented in the controller)

**Edge cases to test:**
| Scenario | How | Expected |
|---|---|---|
| Logout with no cookie at all | Clear cookies manually in Postman (Cookies panel → remove), then call logout | Still `200` success (idempotent — no error) |
| Logout twice in a row | Call logout, then call it again immediately | Both calls return `200` success |
| Tampered/garbage cookie | Manually edit the `refreshToken` cookie value in Postman's Cookies panel to random text, then call logout | Still `200` success (no distinguishable error — by design, to avoid leaking info) |

---

## 4. Refresh — `POST {{baseUrl}}/refresh`

No body needed. Relies on the `refreshToken` cookie.

**Full round-trip test:**
1. Login fresh (step 2) — note the `accessToken` and confirm a `refreshToken` cookie exists.
2. Call `/refresh` immediately.
3. Confirm:
   - Status `200`
   - A **new** `accessToken` is returned (different string than the login one — JWTs include an issued-at timestamp, so even identical payloads produce different tokens)
   - The `refreshToken` cookie value **changes** (check the Cookies panel before and after — rotation means a new one is issued)

**Edge cases to test:**
| Scenario | How | Expected |
|---|---|---|
| Reuse an old (already-rotated) refresh token | Save the cookie value from before step 2 above (copy it manually), call `/refresh`, then manually re-set the cookie to the *old* value and call `/refresh` again | Second call → `401 Invalid refresh token` (already revoked) |
| No refresh cookie at all | Clear cookies, then call `/refresh` | `401 Invalid refresh token` |
| Expired refresh token | Temporarily set `REFRESH_TOKEN_TTL_MS` very low (e.g. `10000` for 10s) in `.env`, restart server, login, wait 15s, then call `/refresh` | `401 Invalid refresh token` |
| After logout | Logout, then try `/refresh` with the (now revoked) cookie | `401 Invalid refresh token` |

---

## 5. Quick status-code reference

| Code | Meaning in this API | Seen from |
|---|---|---|
| `200` | Success | login, logout, refresh |
| `201` | Resource created | register |
| `400` | Validation failed (Zod) | register, login (bad shape) |
| `401` | Invalid credentials / invalid or expired refresh token | login, refresh |
| `409` | Conflict (duplicate email) | register |
| `500` | Unhandled server error | any (should be rare — investigate server logs if seen) |

---

## Notes / things to double check while testing

- If a request unexpectedly returns `500`, check the **server terminal logs**, not just the Postman response — `pino-http` logs the request with the original error attached by `errorHandler` (`message` + `stack`); the response body only shows a generic message in production mode.
- Cookies are `SameSite=Lax`, `Secure` (production only), host-only (no `Domain`), and `HttpOnly`. That only works because the browser always talks to one origin: the Vite proxy in dev, the Vercel rewrite (`webapp/vercel.json`) in production. If API calls are ever made cross-origin again (e.g. a hardcoded `https://ugnay.onrender.com` base URL), the CSRF double-submit pair breaks — `document.cookie` cannot read the HttpOnly cookie, and `SameSite=Lax` cookies are not sent cross-site.