// Double-submit CSRF token for the API's `X-CSRF-Token` header.
//
// The server sets the token as an HttpOnly cookie (the half the browser sends
// automatically) and also returns it in the /auth/csrf response body. The body
// value is the only copy JS can read, so that is what we keep — reading the
// cookie via document.cookie is impossible by design.
//
// In memory only — never localStorage/sessionStorage.
let csrfToken: string | null = null;

export function getCsrfToken(): string | null {
  return csrfToken;
}

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}
