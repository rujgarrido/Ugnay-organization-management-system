import { api } from "@/lib/axios";
import type {
  Proposal,
  ProposalSignature,
  ProposalStatus,
} from "../types/proposal";
import type { ProposalFormInput } from "../schemas/proposal-schema";
import type { SignatureFormInput } from "../schemas/signature-schema";

/**
 * Real data layer for proposals + signatures (US-5.1 / US-5.2 / US-5.3).
 * Backend routes: /organizations/:orgId/proposals[...]. Every call is
 * org-scoped and authorized server-side; the status state machine
 * (assertValidTransition + per-step permissions) is enforced by the service,
 * so this layer simply surfaces its 409/403 errors.
 */

export async function getProposals(orgId: string): Promise<Proposal[]> {
  const { data } = await api.get<{ data: { proposals: Proposal[] } }>(
    `/organizations/${orgId}/proposals`,
  );
  return data.data.proposals;
}

export async function getProposal(orgId: string, proposalId: string): Promise<Proposal> {
  const { data } = await api.get<{ data: { proposal: Proposal } }>(
    `/organizations/${orgId}/proposals/${proposalId}`,
  );
  return data.data.proposal;
}

export async function createProposal(
  orgId: string,
  input: ProposalFormInput,
): Promise<Proposal> {
  const { data } = await api.post<{ data: { proposal: Proposal } }>(
    `/organizations/${orgId}/proposals`,
    { title: input.title, description: input.description },
  );
  return data.data.proposal;
}

export async function updateProposalStatus(
  orgId: string,
  proposalId: string,
  status: ProposalStatus,
): Promise<Proposal> {
  const { data } = await api.patch<{ data: { proposal: Proposal } }>(
    `/organizations/${orgId}/proposals/${proposalId}/status`,
    { status },
  );
  return data.data.proposal;
}

export async function getSignatures(
  orgId: string,
  proposalId: string,
): Promise<ProposalSignature[]> {
  const { data } = await api.get<{ data: { signatures: ProposalSignature[] } }>(
    `/organizations/${orgId}/proposals/${proposalId}/signatures`,
  );
  return data.data.signatures;
}

export async function addSignature(
  orgId: string,
  proposalId: string,
  input: SignatureFormInput,
): Promise<ProposalSignature> {
  const { data } = await api.post<{ data: { signature: ProposalSignature } }>(
    `/organizations/${orgId}/proposals/${proposalId}/signatures`,
    { signatoryName: input.signatoryName, role: input.role },
  );
  return data.data.signature;
}

export async function completeSignature(
  orgId: string,
  proposalId: string,
  signatureId: string,
): Promise<ProposalSignature> {
  const { data } = await api.patch<{ data: { signature: ProposalSignature } }>(
    `/organizations/${orgId}/proposals/${proposalId}/signatures/${signatureId}`,
  );
  return data.data.signature;
}