import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "./auth-token";
import { getCsrfToken, setCsrfToken } from "./csrf-token";

// Relative on purpose: the browser only ever talks to its own origin. Vite
// proxies /api/* in dev (vite.config.ts) and Vercel rewrites it in prod
// (vercel.json), so no API host is ever hardcoded here.
const API_URL = "/api/v1";

const CSRF_ENDPOINT = "/auth/csrf";
const CSRF_HEADER = "X-CSRF-Token";
const UNSAFE_METHODS = ["post", "put", "patch", "delete"];

// The only 403 messages worth refreshing the token for — mirrors the server's
// double-submit check (server/src/middleware/csrf.ts). A permission 403 must
// not be retried.
const CSRF_ERROR_MESSAGES = ["CSRF token is required", "Invalid CSRF token"];

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // sends the httpOnly refresh-token cookie automatically
});

// Attach the access token to every request, plus the CSRF token to unsafe ones.
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (UNSAFE_METHODS.includes(config.method?.toLowerCase() ?? "")) {
    const csrfToken = getCsrfToken();
    if (csrfToken) config.headers[CSRF_HEADER] = csrfToken;
  }
  return config;
});

// /auth/csrf is the only endpoint that issues a token, so it is the single place
// that feeds the in-memory store. Deduped: concurrent 403s share one fetch.
let csrfFetch: Promise<string | null> | null = null;

/** Fetches a fresh CSRF token. Never throws — callers fall back to the old one. */
export function refreshCsrfToken(): Promise<string | null> {
  if (!csrfFetch) {
    csrfFetch = api
      .get<{ data: { csrfToken: string } }>(CSRF_ENDPOINT)
      .then(({ data }) => {
        setCsrfToken(data.data.csrfToken);
        return data.data.csrfToken;
      })
      .catch(() => null)
      .finally(() => {
        csrfFetch = null;
      });
  }

  return csrfFetch;
}

// If two requests 401 at the same moment, we only want ONE refresh call —
// the second request should wait for the first refresh to finish, not
// trigger its own.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  // Uses the `api` instance (not bare axios) so the request interceptor
  // attaches the X-CSRF-Token header — /auth/refresh is CSRF-protected and
  // a bare-axios call would fail with 403 (FLAG-10).
  const { data } = await api.post<{ data: { accessToken: string } }>("/auth/refresh");
  setAccessToken(data.data.accessToken);
  return data.data.accessToken;
}

api.interceptors.response.use(
  (response) => {
    // Any /auth/csrf response carries the freshest token — including the one
    // the auth bootstrap fetches.
    const body = response.data as { data?: { csrfToken?: string } } | undefined;
    if (response.config.url?.includes(CSRF_ENDPOINT) && body?.data?.csrfToken) {
      setCsrfToken(body.data.csrfToken);
    }

    return response;
  },
  async (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & {
      _retry?: boolean;
      _csrfRetry?: boolean;
    }) | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // A rejected double-submit pair means one side rotated (login re-issues the
    // cookie). Refresh the token and replay the request exactly once.
    if (
      error.response?.status === 403 &&
      !originalRequest._csrfRetry &&
      CSRF_ERROR_MESSAGES.includes(error.response.data?.message ?? "")
    ) {
      originalRequest._csrfRetry = true;

      await refreshCsrfToken();

      return api(originalRequest);
    }

    const isAuthEndpoint = originalRequest.url?.includes("/auth/");
    if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest); // retry the original request, once
    } catch (refreshError) {
      clearAccessToken();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    }
  }
);