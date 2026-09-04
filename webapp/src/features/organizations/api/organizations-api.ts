import { PERMISSIONS } from "../types";
import type { Member } from "../types/member";
import type { Organization, Position, PositionWithPermissions } from "../types";
import type { AddMemberInput } from "../schemas/add-member-schema";
import type { OrganizationFormInput } from "../schemas/organization-form-schema";
import {
  MOCK_LATENCY_MS,
  MOCK_MEMBERS,
  MOCK_ORGANIZATION,
  MOCK_POSITIONS,
} from "./mock-organizations-data";

/**
 * TEMPORARY mock-backed data layer for the organizations feature.
 *
 * Signatures match the future API contract so swapping the bodies for
 * real calls through `api` (`@/lib/axios`) requires no changes in the
 * query hooks, components, or types:
 *
 * - getOrganization      -> GET    /organizations/:orgId
 * - updateOrganization   -> PATCH  /organizations/:orgId
 * - archiveOrganization  -> PATCH  /organizations/:orgId (soft archive)
 * - getMembers           -> GET    /organizations/:orgId/members
 * - addMember            -> POST   /organizations/:orgId/members
 * - updateMemberPosition -> PATCH  /organizations/:orgId/members/:memberId
 * - deactivateMember     -> DELETE /organizations/:orgId/members/:memberId (soft)
 * - getPositions         -> GET    /organizations/:orgId/positions
 * - createOrganization   -> POST   /organizations
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findMember(memberId: string): Member {
  const member = MOCK_MEMBERS.find((candidate) => candidate.id === memberId);

  if (!member) {
    throw new Error("Member not found.");
  }

  return member;
}

function assertNotLastAdmin(member: Member): void {
  const activeAdmins = MOCK_MEMBERS.filter(
    (candidate) => candidate.isActive && candidate.permissions.includes(PERMISSIONS.MANAGE_MEMBERS),
  );

  const isTargetAdmin =
    member.isActive && member.permissions.includes(PERMISSIONS.MANAGE_MEMBERS);

  if (isTargetAdmin && activeAdmins.length <= 1) {
    throw new Error("The last remaining admin cannot be demoted or deactivated.");
  }
}

export async function getOrganization(_orgId: string): Promise<Organization> {
  await delay(MOCK_LATENCY_MS);
  return { ...MOCK_ORGANIZATION };
}

export async function getMembers(_orgId: string): Promise<Member[]> {
  await delay(MOCK_LATENCY_MS);
  return MOCK_MEMBERS.map((member) => ({ ...member }));
}

export async function getPositions(_orgId: string): Promise<PositionWithPermissions[]> {
  await delay(MOCK_LATENCY_MS);
  return MOCK_POSITIONS.map((position) => ({ ...position, permissions: [...position.permissions] }));
}

export async function addMember(_orgId: string, input: AddMemberInput): Promise<Member> {
  await delay(MOCK_LATENCY_MS);

  const position = MOCK_POSITIONS.find((candidate) => candidate.id === input.positionId);

  if (!position) {
    throw new Error("Position not found.");
  }

  const existing = MOCK_MEMBERS.find(
    (candidate) => candidate.email.toLowerCase() === input.email.toLowerCase(),
  );

  if (existing) {
    throw new Error("This user is already a member of the organization.");
  }

  // Adds an already-registered user: derive a display name from the email
  // local part until the backend returns the real account name.
  const name = input.email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const member: Member = {
    id: `mem-${Date.now()}`,
    name,
    email: input.email,
    position,
    permissions: [...position.permissions],
    isActive: true,
    joinedAt: new Date().toISOString(),
  };

  MOCK_MEMBERS.push(member);
  return { ...member };
}

export async function updateMemberPosition(
  _orgId: string,
  memberId: string,
  positionId: string,
): Promise<Member> {
  await delay(MOCK_LATENCY_MS);

  const member = findMember(memberId);
  const position = MOCK_POSITIONS.find((candidate) => candidate.id === positionId);

  if (!position) {
    throw new Error("Position not found.");
  }

  const wouldLoseAdmin =
    member.isActive &&
    member.permissions.includes(PERMISSIONS.MANAGE_MEMBERS) &&
    !position.permissions.includes(PERMISSIONS.MANAGE_MEMBERS);

  if (wouldLoseAdmin) {
    assertNotLastAdmin(member);
  }

  member.position = position as Position;
  member.permissions = [...position.permissions];
  return { ...member };
}

export async function deactivateMember(_orgId: string, memberId: string): Promise<Member> {
  await delay(MOCK_LATENCY_MS);

  const member = findMember(memberId);
  assertNotLastAdmin(member);

  member.isActive = false;
  return { ...member };
}

export async function updateOrganization(
  _orgId: string,
  input: OrganizationFormInput,
): Promise<Organization> {
  await delay(MOCK_LATENCY_MS);

  MOCK_ORGANIZATION.name = input.name;
  MOCK_ORGANIZATION.description = input.description || null;
  MOCK_ORGANIZATION.updatedAt = new Date().toISOString();
  return { ...MOCK_ORGANIZATION };
}

export async function archiveOrganization(_orgId: string): Promise<Organization> {
  await delay(MOCK_LATENCY_MS);

  MOCK_ORGANIZATION.status = "archived";
  MOCK_ORGANIZATION.updatedAt = new Date().toISOString();
  return { ...MOCK_ORGANIZATION };
}

export interface CreatedOrganizationResult {
  organization: Organization;
  membership: {
    id: string;
    organization: Organization;
    position: Position;
    permissions: PositionWithPermissions["permissions"];
    isActive: true;
    joinedAt: string;
    removedAt: null;
  };
}

export async function createOrganization(
  input: OrganizationFormInput,
): Promise<CreatedOrganizationResult> {
  await delay(MOCK_LATENCY_MS);

  const now = new Date().toISOString();
  const organization: Organization = {
    id: `org-${Date.now()}`,
    name: input.name,
    description: input.description || null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  const president = MOCK_POSITIONS[0];

  return {
    organization,
    membership: {
      id: `mem-${Date.now()}`,
      organization,
      position: president,
      permissions: [...president.permissions],
      isActive: true,
      joinedAt: now,
      removedAt: null,
    },
  };
}
