export const PROPOSAL_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "completed",
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

/** Legal status transitions (spec US-5.2: assertValidTransition). */
export const PROPOSAL_TRANSITIONS: Record<ProposalStatus, readonly ProposalStatus[]> = {
  draft: ["submitted"],
  submitted: ["under_review"],
  under_review: ["approved", "rejected"],
  approved: ["completed"],
  rejected: [],
  completed: [],
};

export interface Proposal {
  id: string;
  title: string;
  description: string | null;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalSignature {
  id: string;
  proposalId: string;
  signatoryName: string;
  role: string;
  isComplete: boolean;
  createdAt: string;
}
