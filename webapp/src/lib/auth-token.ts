// Access token lives in memory only — never localStorage/sessionStorage.
// It sits outside React state because axios' interceptor needs to read
// it synchronously on every request, before any component has rendered.
let accessToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}