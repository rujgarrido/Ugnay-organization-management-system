-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE';
