import type { NextFunction, Request, Response } from 'express';
import {
  findMembership,
  type SerializedMembership,
} from '../features/organizations/memberships';
import { AppError } from './errorHandler';
import type { AuthenticatedRequest } from './auth.middleware';

/**
 * Resolves the caller's membership for an organization-scoped route
 * (docs/architecture.md US-2.1). Mounts after `authenticate` and exposes:
 *   req.orgContext = { organizationId, membership }
 * 403 when the caller is not an active member of the organization.
 */

export interface OrgContext {
  organizationId: string;
  membership: SerializedMembership;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      orgContext?: OrgContext;
    }
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resolveOrgContext(
  req: AuthenticatedRequest & Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const organizationId = req.params.orgId;
    if (!organizationId || !UUID_RE.test(organizationId)) {
      throw new AppError('Organization not found', 404);
    }

    const membership = await findMembership(req.user.id, organizationId);

    if (!membership || !membership.isActive) {
      throw new AppError('You are not a member of this organization', 403);
    }

    // Archived organizations are deactivated workspaces: reads and writes are
    // both refused so an archived org can't drift back into use (FLAG-12).
    if (membership.organization.status === 'archived') {
      throw new AppError('This organization has been archived', 403);
    }

    req.orgContext = { organizationId, membership };
    next();
  } catch (error) {
    next(error);
  }
}
