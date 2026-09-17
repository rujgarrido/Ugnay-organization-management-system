import type { NextFunction, Request, Response } from 'express';

import { AppError } from './errorHandler';

/**
 * Route-param guard for `@db.Uuid` primary keys.
 *
 * Every id param (orgId/projectId/taskId/memberId) is a uuid column. Passing a
 * malformed value straight to Prisma throws a raw cast error, which surfaces as
 * a 500 instead of "not found". Rejecting the format here keeps a bad URL a
 * plain 404 and avoids the useless database round-trip.
 *
 * Registered via `router.param(name, requireUuidParam(name))` so every current
 * and future route using that param is covered.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function requireUuidParam(resourceName: string) {
  return function uuidParamGuard(
    _req: Request,
    _res: Response,
    next: NextFunction,
    value: string,
  ): void {
    if (!UUID_PATTERN.test(value)) {
      next(new AppError(`${resourceName} not found`, 404));
      return;
    }

    next();
  };
}
