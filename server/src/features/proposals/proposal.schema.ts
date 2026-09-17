import { z } from 'zod';

// Matches webapp/src/features/proposals/types/proposal.ts PROPOSAL_STATUSES
// (the database enum was aligned to this set — migration align_proposal_status).
export const PROPOSAL_STATUS_VALUES = [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'completed',
] as const;

export const createProposalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters.')
    .max(120, 'Title must be at most 120 characters.'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be at most 500 characters.')
    .optional()
    .default(''),
});

export const updateProposalStatusSchema = z.object({
  status: z.enum(PROPOSAL_STATUS_VALUES),
});

export const createSignatureSchema = z.object({
  signatoryName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(80, 'Name must be at most 80 characters.'),
  role: z
    .string()
    .trim()
    .min(2, 'Role must be at least 2 characters.')
    .max(60, 'Role must be at most 60 characters.'),
});