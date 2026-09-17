import { Router } from 'express';
import { ProposalController } from './proposal.controller';
import { catchAsync } from '../../middleware/asyncHandler';
import { validate } from '../../middleware/validate';
import { apiRateLimiter } from '../../middleware/rateLimiter';
import { authenticate } from '../../middleware/auth.middleware';
import { csrfProtection } from '../../middleware/csrf';
import { resolveOrgContext } from '../../middleware/resolveOrgContext';
import { requirePermission } from '../../middleware/requirePermission';
import { requireUuidParam } from '../../middleware/validateUuidParam';
import {
  createProposalSchema,
  updateProposalStatusSchema,
  createSignatureSchema,
} from './proposal.schema';

/**
 * US-5.1 / US-5.2 / US-5.3 — proposal + signature routes, mounted at
 * `/api/v1/organizations/:orgId/proposals[...]`. Reads need membership only;
 * proposal creation is CREATE_PROPOSAL and signature management is
 * UPDATE_PROPOSAL. The status PATCH is intentionally NOT permission-gated at
 * the route level: leaving draft requires SUBMIT_PROPOSAL while later
 * transitions require UPDATE_PROPOSAL — enforced per transition in the
 * service (see proposal.service.ts).
 */
export const proposalRoutes = (controller: ProposalController): Router => {
  const router = Router();

  // Malformed uuid params become 404s before they reach Prisma (see guard).
  router.param('orgId', requireUuidParam('Organization'));
  router.param('proposalId', requireUuidParam('Proposal'));
  router.param('signatureId', requireUuidParam('Signature'));

  router.use('/:orgId', authenticate, catchAsync(resolveOrgContext));

  // US-5.1 — proposals
  router.get('/:orgId/proposals', catchAsync(controller.listProposals));
  router.post(
    '/:orgId/proposals',
    csrfProtection,
    apiRateLimiter,
    requirePermission('CREATE_PROPOSAL'),
    validate(createProposalSchema),
    catchAsync(controller.createProposal),
  );
  router.get('/:orgId/proposals/:proposalId', catchAsync(controller.getProposal));
  router.patch(
    '/:orgId/proposals/:proposalId/status',
    csrfProtection,
    apiRateLimiter,
    validate(updateProposalStatusSchema),
    catchAsync(controller.updateProposalStatus),
  );

  // US-5.3 — signatures
  router.get('/:orgId/proposals/:proposalId/signatures', catchAsync(controller.listSignatures));
  router.post(
    '/:orgId/proposals/:proposalId/signatures',
    csrfProtection,
    apiRateLimiter,
    requirePermission('UPDATE_PROPOSAL'),
    validate(createSignatureSchema),
    catchAsync(controller.addSignature),
  );
  router.patch(
    '/:orgId/proposals/:proposalId/signatures/:signatureId',
    csrfProtection,
    apiRateLimiter,
    requirePermission('UPDATE_PROPOSAL'),
    catchAsync(controller.completeSignature),
  );

  return router;
};