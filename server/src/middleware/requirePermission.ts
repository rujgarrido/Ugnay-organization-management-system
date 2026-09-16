import type { NextFunction, Request, Response } from 'express';
import { AppError } from './errorHandler';

/**
 * Permission gate for org-scoped routes. Must run AFTER resolveOrgContext.
 * Usage: router.patch('/:orgId/members/:memberId', requirePermission('MANAGE_MEMBERS'), ...)
 */
export function requirePermission(code: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const membership = req.orgContext?.membership;

    if (!membership || !membership.isActive || !membership.permissions.includes(code)) {
      next(new AppError('You do not have permission to perform this action', 403));
      return;
    }

    next();
  };
}
