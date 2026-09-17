import { prisma } from "../../config/database";

/**
 * Cross-module membership capability (see docs/architecture.md: modules must
 * not query OrganizationMember directly — they call this helper instead).
 *
 * The serialized shapes mirror the webapp contract
 * (webapp/src/features/organizations/types/organization.ts) so no frontend
 * mapping layer is needed.
 */

export interface SerializedOrganization {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface SerializedPosition {
  id: string;
  name: string;
  description: string | null;
}

export interface SerializedMembership {
  id: string;
  organization: SerializedOrganization;
  position: SerializedPosition;
  permissions: string[];
  isActive: boolean;
  joinedAt: string;
  removedAt: string | null;
}

export interface MemberWithRelations {
  id: string;
  isActive: boolean;
  joinedAt: Date;
  removedAt: Date | null;
  organization: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
  position: {
    id: string;
    name: string;
    description: string | null;
    permissions: Array<{ permission: { code: string } }>;
  };
}

export const membershipInclude = {
  organization: true,
  position: { include: { permissions: { include: { permission: true } } } },
} as const;

export function serializeOrganization(organization: {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): SerializedOrganization {
  return {
    id: organization.id,
    name: organization.name,
    description: organization.description,
    status: organization.status === "ARCHIVED" ? "archived" : "active",
    createdAt: organization.createdAt.toISOString(),
    updatedAt: organization.updatedAt.toISOString(),
  };
}

export function serializeMembership(member: MemberWithRelations): SerializedMembership {
  return {
    id: member.id,
    organization: serializeOrganization(member.organization),
    position: {
      id: member.position.id,
      name: member.position.name,
      description: member.position.description,
    },
    permissions: member.position.permissions.map((entry) => entry.permission.code),
    isActive: member.isActive,
    joinedAt: member.joinedAt.toISOString(),
    removedAt: member.removedAt ? member.removedAt.toISOString() : null,
  };
}

/**
 * Every active membership of a user — drives `GET /organizations/mine` and the
 * auth user payload.
 *
 * Archived organizations are excluded (FLAG-12): archiving deactivates the
 * workspace, so it must not remain selectable in the org switcher.
 */
export async function listUserMemberships(userId: string): Promise<SerializedMembership[]> {
  const members = await prisma.organizationMember.findMany({
    where: {
      userId,
      isActive: true,
      organization: { status: 'ACTIVE' },
    },
    include: membershipInclude,
    orderBy: { joinedAt: "asc" },
  });

  return members.map((member) => serializeMembership(member as MemberWithRelations));
}

/** Resolves one membership (with permissions) for the org-context middleware. */
export async function findMembership(userId: string, organizationId: string) {
  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    include: membershipInclude,
  });

  return member ? serializeMembership(member as MemberWithRelations) : null;
}
