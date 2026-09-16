import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { recordActivity } from '../organizations/activity.service';
import type { SerializedMembership } from '../organizations/memberships';

/**
 * Proposals + signatures (US-5.1 / US-5.2 / US-5.3).
 *
 * Status travels UPPERCASE in the database and lowercase on the wire — mapped
 * here, in one place (same pattern as tasks). The state machine lives in this
 * service, not in routes: transitions carry per-step permission requirements
 * (SUBMIT_PROPOSAL to leave draft, UPDATE_PROPOSAL for review/decision steps),
 * which a single route-level requirePermission cannot express.
 */

const TO_DB_STATUS = {
  draft: 'DRAFT',
  submitted: 'SUBMITTED',
  under_review: 'UNDER_REVIEW',
  approved: 'APPROVED',
  rejected: 'REJECTED',
  completed: 'COMPLETED',
} as const;

export type WireProposalStatus = keyof typeof TO_DB_STATUS;

// US-5.2 assertValidTransition — same shape as the webapp PROPOSAL_TRANSITIONS.
const TRANSITIONS: Record<WireProposalStatus, readonly WireProposalStatus[]> = {
  draft: ['submitted'],
  submitted: ['under_review'],
  under_review: ['approved', 'rejected'],
  approved: ['completed'],
  rejected: [],
  completed: [],
};

export interface SerializedProposal {
  id: string;
  title: string;
  description: string | null;
  status: WireProposalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedSignature {
  id: string;
  proposalId: string;
  signatoryName: string;
  role: string;
  isComplete: boolean;
  createdAt: string;
}

type ProposalRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type SignatureRow = {
  id: string;
  proposalId: string;
  signatoryName: string;
  signatoryRole: string;
  status: string;
  createdAt: Date;
};

export function serializeProposal(proposal: ProposalRow): SerializedProposal {
  return {
    id: proposal.id,
    title: proposal.title,
    description: proposal.description,
    status: proposal.status.toLowerCase() as WireProposalStatus,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
  };
}

export function serializeSignature(signature: SignatureRow): SerializedSignature {
  return {
    id: signature.id,
    proposalId: signature.proposalId,
    signatoryName: signature.signatoryName,
    role: signature.signatoryRole,
    isComplete: signature.status === 'COMPLETED',
    createdAt: signature.createdAt.toISOString(),
  };
}

export interface ActorContext {
  membership: SerializedMembership;
}

async function findProposalInOrg(organizationId: string, proposalId: string) {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, organizationId },
  });

  if (!proposal) {
    throw new AppError('Proposal not found', 404);
  }

  return proposal;
}

function assertTransition(from: WireProposalStatus, to: WireProposalStatus): void {
  const allowed = TRANSITIONS[from];

  if (!allowed.includes(to)) {
    throw new AppError(
      `Cannot move a ${from.replace('_', ' ')} proposal to ${to.replace('_', ' ')}`,
      409,
    );
  }
}

function assertTransitionPermission(
  from: WireProposalStatus,
  membership: SerializedMembership,
): void {
  // Leaving draft = formally submitting the proposal — its own capability.
  // Every other move is part of reviewing/deciding, gated by UPDATE_PROPOSAL.
  const required = from === 'draft' ? 'SUBMIT_PROPOSAL' : 'UPDATE_PROPOSAL';
  if (!membership.permissions.includes(required)) {
    throw new AppError('You do not have permission to perform this action', 403);
  }
}

async function record(
  organizationId: string,
  actor: ActorContext,
  action: string,
  entityId: string,
  entityName?: string,
): Promise<void> {
  await recordActivity(prisma, {
    organizationId,
    organizationMemberId: actor.membership.id,
    action,
    entityType: 'proposal',
    entityId,
    entityName,
  });
}

export class ProposalService {
  async list(organizationId: string): Promise<{ proposals: SerializedProposal[] }> {
    const rows = await prisma.proposal.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return { proposals: rows.map(serializeProposal) };
  }

  async get(organizationId: string, proposalId: string): Promise<{ proposal: SerializedProposal }> {
    const proposal = await findProposalInOrg(organizationId, proposalId);
    return { proposal: serializeProposal(proposal) };
  }

  async create(
    organizationId: string,
    input: { title: string; description: string },
    actor: ActorContext,
  ): Promise<{ proposal: SerializedProposal }> {
    const proposal = await prisma.proposal.create({
      data: {
        organizationId,
        title: input.title,
        description: input.description || null,
        createdById: actor.membership.id,
      },
    });

    await record(organizationId, actor, 'created_proposal', proposal.id, proposal.title);
    return { proposal: serializeProposal(proposal) };
  }

  async updateStatus(
    organizationId: string,
    proposalId: string,
    status: WireProposalStatus,
    actor: ActorContext,
  ): Promise<{ proposal: SerializedProposal }> {
    const proposal = await findProposalInOrg(organizationId, proposalId);
    const from = proposal.status.toLowerCase() as WireProposalStatus;

    assertTransition(from, status);
    assertTransitionPermission(from, actor.membership);

    // A proposal may only be marked completed once every signatory has signed.
    if (from === 'approved' && status === 'completed') {
      const pending = await prisma.proposalSignature.count({
        where: { proposalId, status: 'PENDING' },
      });
      if (pending > 0) {
        throw new AppError('All signatories must complete before the proposal is completed', 409);
      }
    }

    const updated = await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: TO_DB_STATUS[status] },
    });

    const action =
      from === 'draft' && status === 'submitted' ? 'submitted_proposal' : 'updated_proposal_status';
    await record(organizationId, actor, action, updated.id, updated.title);

    return { proposal: serializeProposal(updated) };
  }

  async listSignatures(
    organizationId: string,
    proposalId: string,
  ): Promise<{ signatures: SerializedSignature[] }> {
    await findProposalInOrg(organizationId, proposalId);

    const rows = await prisma.proposalSignature.findMany({
      where: { proposalId },
      orderBy: { createdAt: 'asc' },
    });

    return { signatures: rows.map(serializeSignature) };
  }

  async addSignature(
    organizationId: string,
    proposalId: string,
    input: { signatoryName: string; role: string },
    actor: ActorContext,
  ): Promise<{ signature: SerializedSignature }> {
    const proposal = await findProposalInOrg(organizationId, proposalId);

    // No new signatories on decided proposals.
    if (proposal.status === 'REJECTED' || proposal.status === 'COMPLETED') {
      throw new AppError('Cannot add signatories to a decided proposal', 409);
    }

    const signature = await prisma.proposalSignature.create({
      data: {
        proposalId,
        signatoryName: input.signatoryName,
        signatoryRole: input.role,
      },
    });

    await record(organizationId, actor, 'added_signatory', proposal.id, proposal.title);
    return { signature: serializeSignature(signature) };
  }

  async completeSignature(
    organizationId: string,
    proposalId: string,
    signatureId: string,
    actor: ActorContext,
  ): Promise<{ signature: SerializedSignature }> {
    await findProposalInOrg(organizationId, proposalId);

    const signature = await prisma.proposalSignature.findFirst({
      where: { id: signatureId, proposalId },
    });

    if (!signature) {
      throw new AppError('Signature not found', 404);
    }

    if (signature.status === 'COMPLETED') {
      return { signature: serializeSignature(signature) };
    }

    const updated = await prisma.proposalSignature.update({
      where: { id: signatureId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    await record(organizationId, actor, 'completed_signature', proposalId, signature.signatoryName);
    return { signature: serializeSignature(updated) };
  }
}