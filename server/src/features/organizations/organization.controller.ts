import type { Request, Response } from 'express';
import { OrganizationService } from './organization.service';
import { MemberService } from './member.service';
import { listActivity, getDashboardCounts } from './activity.service';
import { activityQuerySchema } from './organization.schema';
import { AppError } from '../../middleware/errorHandler';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

/**
 * Thin HTTP layer for the organizations module. Authorization is enforced by
 * the route pipeline (authenticate -> resolveOrgContext -> requirePermission);
 * handlers only pass validated input down and shape the envelope.
 */

function requireUserId(req: AuthenticatedRequest): string {
  if (!req.user?.id) {
    throw new AppError('Authentication required', 401);
  }
  return req.user.id;
}

function requireOrgContext(req: Request) {
  const ctx = req.orgContext;
  if (!ctx) {
    throw new AppError('Organization context not resolved', 500);
  }
  return ctx;
}

export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly memberService: MemberService,
  ) {}

  create = async (req: AuthenticatedRequest, res: Response) => {
    const result = await this.organizationService.create(requireUserId(req), req.body);

    return res.status(201).json({
      status: 201,
      message: 'Organization created successfully',
      data: result,
    });
  };

  getMine = async (req: AuthenticatedRequest, res: Response) => {
    const result = await this.organizationService.getMine(requireUserId(req));

    return res.status(200).json({
      status: 200,
      message: 'Organizations retrieved successfully',
      data: result,
    });
  };

  getDetail = async (req: Request, res: Response) => {
    const { organizationId } = requireOrgContext(req);
    const result = await this.organizationService.getDetail(organizationId);

    return res.status(200).json({
      status: 200,
      message: 'Organization retrieved successfully',
      data: result,
    });
  };

  update = async (req: Request, res: Response) => {
    const ctx = requireOrgContext(req);
    const result = await this.organizationService.update(ctx.organizationId, req.body, {
      organizationMemberId: ctx.membership.id,
    });

    return res.status(200).json({
      status: 200,
      message: 'Organization updated successfully',
      data: result,
    });
  };

  archive = async (req: Request, res: Response) => {
    const ctx = requireOrgContext(req);
    const result = await this.organizationService.archive(ctx.organizationId, {
      organizationMemberId: ctx.membership.id,
    });

    return res.status(200).json({
      status: 200,
      message: 'Organization archived successfully',
      data: result,
    });
  };

  getPositions = async (req: Request, res: Response) => {
    const { organizationId } = requireOrgContext(req);
    const result = await this.organizationService.getPositions(organizationId);

    return res.status(200).json({
      status: 200,
      message: 'Positions retrieved successfully',
      data: result,
    });
  };

  getMembers = async (req: Request, res: Response) => {
    const { organizationId } = requireOrgContext(req);
    const result = await this.memberService.getMembers(organizationId);

    return res.status(200).json({
      status: 200,
      message: 'Members retrieved successfully',
      data: result,
    });
  };

  addMember = async (req: Request, res: Response) => {
    const ctx = requireOrgContext(req);
    const result = await this.memberService.addMember(ctx.organizationId, req.body, {
      organizationMemberId: ctx.membership.id,
    });

    return res.status(201).json({
      status: 201,
      message: 'Member added successfully',
      data: result,
    });
  };

  updateMemberPosition = async (req: Request, res: Response) => {
    const ctx = requireOrgContext(req);
    const result = await this.memberService.updateMemberPosition(
      ctx.organizationId,
      req.params.memberId,
      req.body.positionId,
      { organizationMemberId: ctx.membership.id },
    );

    return res.status(200).json({
      status: 200,
      message: 'Member position updated successfully',
      data: result,
    });
  };

  deactivateMember = async (req: Request, res: Response) => {
    const ctx = requireOrgContext(req);
    const result = await this.memberService.deactivateMember(
      ctx.organizationId,
      req.params.memberId,
      { organizationMemberId: ctx.membership.id },
    );

    return res.status(200).json({
      status: 200,
      message: 'Member deactivated successfully',
      data: result,
    });
  };

  getDashboard = async (req: Request, res: Response) => {
    const { organizationId } = requireOrgContext(req);
    const overview = await getDashboardCounts(organizationId);

    return res.status(200).json({
      status: 200,
      message: 'Dashboard overview retrieved successfully',
      data: overview,
    });
  };

  getActivity = async (req: Request, res: Response) => {
    const { organizationId } = requireOrgContext(req);
    // Query-string (not body) validation — validate() middleware parses body only.
    const { entityType, page } = activityQuerySchema.parse(req.query);
    const result = await listActivity(organizationId, page, entityType);

    return res.status(200).json({
      status: 200,
      message: 'Activity retrieved successfully',
      data: result,
    });
  };
}
