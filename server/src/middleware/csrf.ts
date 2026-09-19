import { randomBytes, timingSafeEqual } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

import { csrfTokenCookieOptions } from '../config/cookies';

import { AppError } from './errorHandler';

export const CSRF_COOKIE = 'csrfToken';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Creates and sets the CSRF cookie, and returns the token so a
// GET /auth/csrf endpoint can also hand it to the client in the body.
export function issueCsrfToken(res: Response): string {
  const token = randomBytes(32).toString('hex');

  res.cookie(CSRF_COOKIE, token, csrfTokenCookieOptions);

  return token;
}

// Only creates and sets the CSRF cookie (login flow)
export function setCsrfCookie(res: Response): void {
  issueCsrfToken(res);
}

// Validates the double-submit CSRF pair on unsafe methods
export function csrfProtection(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (!unsafeMethods.has(req.method)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get('x-csrf-token');

  if (!cookieToken || !headerToken) {
    next(new AppError('CSRF token is required', 403));
    return;
  }

  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);

  if (
    cookieBuffer.length !== headerBuffer.length ||
    !timingSafeEqual(cookieBuffer, headerBuffer)
  ) {
    next(new AppError('Invalid CSRF token', 403));
    return;
  }

  next();
}