-- FLAG-16: collapse the unused 8-value ProposalStatus workflow enum to the
-- 6 statuses defined by US-5.2 (matches webapp PROPOSAL_STATUSES 1:1).
-- The proposals feature had no routes before this migration, so remapping is
-- a safety net only. The remap runs inside the column type change (CASE-based
-- USING) because the old values only exist until the cast happens.

ALTER TYPE "ProposalStatus" RENAME TO "ProposalStatus_old";
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED');

ALTER TABLE "Proposal"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ProposalStatus" USING (
    CASE "status"::text
      WHEN 'AWAITING_SIGNATURES' THEN 'UNDER_REVIEW'
      WHEN 'SUBMITTED_TO_OFFICE' THEN 'UNDER_REVIEW'
      WHEN 'NEEDS_REVISION' THEN 'UNDER_REVIEW'
      WHEN 'CANCELLED' THEN 'REJECTED'
      ELSE "status"::text
    END::"ProposalStatus"
  ),
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';

DROP TYPE "ProposalStatus_old";