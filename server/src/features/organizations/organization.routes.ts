import { Router } from 'express';
import { OrganizationController } from './organization.controller';
import { catchAsync } from '../../middleware/asyncHandler';
import { validate } from '../../middleware/validate';
import { apiRateLimiter } from '../../middleware/rateLimiter';
import { authenticate } from '../../middleware/auth.middleware';
import { csrfProtection } from '../../middleware/csrf';
import { resolveOrgContext } from '../../middleware/resolveOrgContext';
import { requirePermission } from '../../middleware/requirePermission';
import { requireUuidParam } from '../../middleware/validateUuidParam';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  addMemberSchema,
  updateMemberPositionSchema,
} from './organization.schema';

export const organizationRoutes = (controller: OrganizationController): Router => {
  const router = Router();

  // Malformed uuid params become 404s before they reach Prisma (see guard).
  router.param('orgId', requireUuidParam('Organization'));
  router.param('memberId', requireUuidParam('Member'));

  // Session bootstrap for US-1.5 / US-1.6: what orgs does the caller belong to.
  router.get('/mine', apiRateLimiter, authenticate, catchAsync(controller.getMine));

  // US-2.2: atomic create (org + default positions + President membership).
  router.post(
    '/',
    authenticate,
    csrfProtection,
    apiRateLimiter,
    validate(createOrganizationSchema),
    catchAsync(controller.create),
  );

  // Everything below is scoped to one organization: resolve membership first,
  // then gate writes by permission (FLAG-5).
  router.use('/:orgId', authenticate, catchAsync(resolveOrgContext));

  // US-2.6 — profile
  router.get('/:orgId', catchAsync(controller.getDetail));
  router.patch(
    '/:orgId',
    csrfProtection,
    apiRateLimiter,
    requirePermission('MANAGE_MEMBERS'),
    validate(updateOrganizationSchema),
    catchAsync(controller.update),
  );
  router.delete(
    '/:orgId',
    csrfProtection,
    apiRateLimiter,
    requirePermission('MANAGE_MEMBERS'),
    catchAsync(controller.archive),
  );

  // US-2.7 — positions (read-only for MVP)
  router.get('/:orgId/positions', catchAsync(controller.getPositions));

  // US-2.4 / US-2.5 — members
  router.get('/:orgId/members', catchAsync(controller.getMembers));
  router.post(
    '/:orgId/members',
    csrfProtection,
    apiRateLimiter,
    requirePermission('MANAGE_MEMBERS'),
    validate(addMemberSchema),
    catchAsync(controller.addMember),
  );
  router.patch(
    '/:orgId/members/:memberId',
    csrfProtection,
    apiRateLimiter,
    requirePermission('MANAGE_MEMBERS'),
    validate(updateMemberPositionSchema),
    catchAsync(controller.updateMemberPosition),
  );
  router.delete(
    '/:orgId/members/:memberId',
    csrfProtection,
    apiRateLimiter,
    requirePermission('MANAGE_MEMBERS'),
    catchAsync(controller.deactivateMember),
  );

  // US-4.1 / US-4.2 — dashboard + activity feed
  router.get('/:orgId/dashboard', catchAsync(controller.getDashboard));
  router.get('/:orgId/activity', catchAsync(controller.getActivity));

  return router;
};
