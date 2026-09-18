// Double-submit CSRF token for the API's `X-CSRF-Token` header.
//
// GET /auth/csrf returns the token in the response body *and* sets a `csrfToken`
// cookie. The body value is the source of truth: when the API sets that cookie
// HttpOnly, `document.cookie` can't see it and the previous cookie-only read
// silently produced no header (403 "CSRF token is required"). The cookie is kept
// as a fallback for same-site deployments where it stays readable.
//
// In memory only — never localStorage/sessionStorage.
const CSRF_COOKIE = "csrfToken";

let csrfToken: string | null = null;

export function getCsrfToken(): string | null {
  return csrfToken ?? readCsrfCookie();
}

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

function readCsrfCookie(): string | null {
  const prefix = `${CSRF_COOKIE}=`;
  return (
    document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(prefix))
      ?.slice(prefix.length) ?? null
  );
}
