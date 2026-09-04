import type {
  Proposal,
  ProposalSignature,
  ProposalStatus,
} from "../types/proposal";
import { PROPOSAL_TRANSITIONS } from "../types/proposal";
import type { ProposalFormInput } from "../schemas/proposal-schema";
import type { SignatureFormInput } from "../schemas/signature-schema";
import {
  MOCK_LATENCY_MS,
  MOCK_PROPOSALS,
  MOCK_SIGNATURES,
} from "./mock-proposals-data";

/**
 * TEMPORARY mock-backed data layer for the proposals feature.
 *
 * Signatures match the future API contract so swapping the bodies for
 * real calls through `api` (`@/lib/axios`) requires no changes in the
 * query hooks, components, or types:
 *
 * - getProposals         -> GET   /organizations/:orgId/proposals
 * - createProposal       -> POST  /organizations/:orgId/proposals
 * - getProposal          -> GET   /organizations/:orgId/proposals/:proposalId
 * - updateProposalStatus -> PATCH /proposals/:proposalId/status (assertValidTransition)
 * - getSignatures        -> GET   /proposals/:proposalId/signatures
 * - addSignature         -> POST  /proposals/:proposalId/signatures
 * - completeSignature    -> PATCH /proposals/:proposalId/signatures/:signatureId
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findProposal(proposalId: string): Proposal {
  const proposal = MOCK_PROPOSALS.find((candidate) => candidate.id === proposalId);

  if (!proposal) {
    throw new Error("Proposal not found.");
  }

  return proposal;
}

export async function getProposals(_orgId: string): Promise<Proposal[]> {
  await delay(MOCK_LATENCY_MS);
  return MOCK_PROPOSALS.map((proposal) => ({ ...proposal }));
}

export async function getProposal(_orgId: string, proposalId: string): Promise<Proposal> {
  await delay(MOCK_LATENCY_MS);
  return { ...findProposal(proposalId) };
}

export async function createProposal(_orgId: string, input: ProposalFormInput): Promise<Proposal> {
  await delay(MOCK_LATENCY_MS);

  const now = new Date().toISOString();
  const proposal: Proposal = {
    id: `prp-${Date.now()}`,
    title: input.title,
    description: input.description || null,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };

  MOCK_PROPOSALS.push(proposal);
  return { ...proposal };
}

export async function updateProposalStatus(
  _orgId: string,
  proposalId: string,
  status: ProposalStatus,
): Promise<Proposal> {
  await delay(MOCK_LATENCY_MS);

  const proposal = findProposal(proposalId);
  const legalTransitions = PROPOSAL_TRANSITIONS[proposal.status];

  if (!legalTransitions.includes(status)) {
    throw new Error(`Cannot move a ${proposal.status.replace("_", " ")} proposal to ${status.replace("_", " ")}.`);
  }

  proposal.status = status;
  proposal.updatedAt = new Date().toISOString();
  return { ...proposal };
}

export async function getSignatures(proposalId: string): Promise<ProposalSignature[]> {
  await delay(MOCK_LATENCY_MS);
  return MOCK_SIGNATURES.filter((signature) => signature.proposalId === proposalId).map((signature) => ({
    ...signature,
  }));
}

export async function addSignature(
  proposalId: string,
  input: SignatureFormInput,
): Promise<ProposalSignature> {
  await delay(MOCK_LATENCY_MS);

  findProposal(proposalId);

  const signature: ProposalSignature = {
    id: `sig-${Date.now()}`,
    proposalId,
    signatoryName: input.signatoryName,
    role: input.role,
    isComplete: false,
    createdAt: new Date().toISOString(),
  };

  MOCK_SIGNATURES.push(signature);
  return { ...signature };
}

export async function completeSignature(
  proposalId: string,
  signatureId: string,
): Promise<ProposalSignature> {
  await delay(MOCK_LATENCY_MS);

  const signature = MOCK_SIGNATURES.find(
    (candidate) => candidate.id === signatureId && candidate.proposalId === proposalId,
  );

  if (!signature) {
    throw new Error("Signature not found.");
  }

  signature.isComplete = true;
  return { ...signature };
}
