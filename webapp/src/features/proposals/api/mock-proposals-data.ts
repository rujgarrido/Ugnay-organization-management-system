import type { Proposal, ProposalSignature } from "../types/proposal";

/**
 * TEMPORARY mock data for the proposals feature.
 * Isolated in this file so it can be deleted wholesale once the
 * `/organizations/:orgId/proposals` endpoints exist.
 */

export const MOCK_LATENCY_MS = 400;

const DAY_IN_MS = 86_400_000;

function isoFromNow(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * DAY_IN_MS).toISOString();
}

export const MOCK_PROPOSALS: Proposal[] = [
  {
    id: "prp-1",
    title: "Campus-wide tooling partnership",
    description: "Partnership proposal with the student affairs office.",
    status: "under_review",
    createdAt: isoFromNow(20),
    updatedAt: isoFromNow(4),
  },
  {
    id: "prp-2",
    title: "Q3 equipment budget",
    description: "Request to purchase recording equipment for workshops.",
    status: "submitted",
    createdAt: isoFromNow(10),
    updatedAt: isoFromNow(2),
  },
  {
    id: "prp-3",
    title: "Community workshop series",
    description: "Six-week workshop program for local organizations.",
    status: "draft",
    createdAt: isoFromNow(5),
    updatedAt: isoFromNow(1),
  },
  {
    id: "prp-4",
    title: "2025 booth sponsorship",
    description: "Sponsorship package for last year's fair.",
    status: "completed",
    createdAt: isoFromNow(180),
    updatedAt: isoFromNow(120),
  },
];

export const MOCK_SIGNATURES: ProposalSignature[] = [
  {
    id: "sig-1",
    proposalId: "prp-1",
    signatoryName: "Rui Garrido",
    role: "President",
    isComplete: true,
    createdAt: isoFromNow(18),
  },
  {
    id: "sig-2",
    proposalId: "prp-1",
    signatoryName: "Kaye Mendoza",
    role: "Treasurer",
    isComplete: false,
    createdAt: isoFromNow(18),
  },
  {
    id: "sig-3",
    proposalId: "prp-1",
    signatoryName: "Maria Santos",
    role: "Vice President",
    isComplete: false,
    createdAt: isoFromNow(17),
  },
  {
    id: "sig-4",
    proposalId: "prp-2",
    signatoryName: "Kaye Mendoza",
    role: "Treasurer",
    isComplete: false,
    createdAt: isoFromNow(9),
  },
];
