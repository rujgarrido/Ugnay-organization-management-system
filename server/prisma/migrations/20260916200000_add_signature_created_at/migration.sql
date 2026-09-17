-- Add createdAt to ProposalSignature for frontend contract + list ordering
ALTER TABLE "ProposalSignature" ADD COLUMN "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
