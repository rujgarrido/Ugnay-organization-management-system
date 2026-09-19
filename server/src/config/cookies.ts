import { env } from './env';
import { REFRESH_TOKEN_TTL_MS } from './constants';

const isProduction = env.NODE_ENV === 'production';

/**
 * Shared attributes for every auth cookie.
 *
 * No `domain` key on purpose: host-only cookies are what keep this working in
 * both environments, because the browser only ever talks to one origin (the
 * Vite proxy in dev, the Vercel rewrite in prod). `sameSite: 'lax'` is safe for
 * the same reason — `'none'` was only needed while the API was a different site.
 */
const baseCookieOptions = {
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: REFRESH_TOKEN_TTL_MS,
};

/** Refresh token — sent automatically, never read by JS. */
export const refreshTokenCookieOptions = {
  ...baseCookieOptions,
  httpOnly: true,
};

/** CSRF token — the client reads its value from the /auth/csrf response body. */
export const csrfTokenCookieOptions = {
  ...baseCookieOptions,
  httpOnly: true,
};

/**
 * Attributes for clearing a cookie. `maxAge` is deliberately omitted: `Max-Age`
 * takes precedence over `Expires`, so passing it would leave the cookie in place.
 */
export const clearedCookieOptions = {
  secure: baseCookieOptions.secure,
  sameSite: baseCookieOptions.sameSite,
  path: baseCookieOptions.path,
};