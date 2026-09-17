import type { Request, Response } from 'express';
import { ProposalService } from './proposal.service';
import type { WireProposalStatus } from './proposal.service';
import { AppError } from '../../middleware/errorHandler';

/**
 * Thin HTTP layer for proposals + signatures. Org membership is enforced by
 * the route pipeline; the per-transition permission checks (SUBMIT_PROPOSAL /
 * UPDATE_PROPOSAL) live in the service because they depend on the transition.
 */

function requireOrgContext(req: Request) {
  const ctx = req.orgContext;
  if (!ctx) {
    throw new AppError('Organization context not resolved', 500);
  }
  return ctx;
}

export class ProposalController {
  // eslint-disable-next-line no-useless-constructor
  constructor(private readonly proposalService: ProposalService) {}

  listProposals = async (req: Request, res: Response) => {
    const { organizationId } = requireOrgContext(req);
    const result = await this.proposalService.list(organizationId);

    return res.status(200).json({
      status: 200,
      message: 'Proposals retrieved successfully',
      data: result,
    });
  };

  getProposal = async (req: Request, res: Response) => {
    const { organizationId } = requireOrgContext(req);
    const result = await this.proposalService.get(organizationId, req.params.proposalId);

    return res.status(200).json({
      status: 200,
      message: 'Proposal retrieved successfully',
      data: result,
    });
  };

  createProposal = async (req: Request, res: Response) => {
    const ctx = requireOrgContext(req);
    const result = await this.proposalService.create(ctx.organizationId, req.body, {
      membership: ctx.membership,
    });

    return res.status(201).json({
      status: 201,
      message: 'Proposal created successfully',
      data: result,
    });
  };

  updateProposalStatus = async (req: Request, res: Response) => {
    const ctx = requireOrgContext(req);
    const result = await this.proposalService.updateStatus(
      ctx.organizationId,
      req.params.proposalId,
      req.body.status as WireProposalStatus,
      { membership: ctx.membership },
    );

    return res.status(200).json({
      status: 200,
      message: 'Proposal status updated successfully',
      data: result,
    });
  };

  listSignatures = async (req: Request, res: Response) => {
    const { organizationId } = requireOrgContext(req);
    const result = await this.proposalService.listSignatures(
      organizationId,
      req.params.proposalId,
    );

    return res.status(200).json({
      status: 200,
      message: 'Signatures retrieved successfully',
      data: result,
    });
  };

  addSignature = async (req: Request, res: Response) => {
    const ctx = requireOrgContext(req);
    const result = await this.proposalService.addSignature(
      ctx.organizationId,
      req.params.proposalId,
      req.body,
      { membership: ctx.membership },
    );

    return res.status(201).json({
      status: 201,
      message: 'Signatory added successfully',
      data: result,
    });
  };

  completeSignature = async (req: Request, res: Response) => {
    const ctx = requireOrgContext(req);
    const result = await this.proposalService.completeSignature(
      ctx.organizationId,
      req.params.proposalId,
      req.params.signatureId,
      { membership: ctx.membership },
    );

    return res.status(200).json({
      status: 200,
      message: 'Signature completed successfully',
      data: result,
    });
  };
}