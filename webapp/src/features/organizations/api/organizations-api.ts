import { api } from "@/lib/axios";
import type { Member } from "../types/member";
import type { Organization, OrganizationMembership, PositionWithPermissions } from "../types";
import type { AddMemberInput } from "../schemas/add-member-schema";
import type { OrganizationFormInput } from "../schemas/organization-form-schema";

/**
 * Real data layer for the organizations feature (backend: /api/v1/organizations).
 * Response shapes mirror the backend serializers 1:1 — no client mapping.
 */

export interface CreatedOrganizationResult {
  organization: Organization;
  /** The creator's own membership (President) — mirrors the backend serializer. */
  membership: OrganizationMembership;
}

export async function getOrganization(orgId: string): Promise<Organization> {
  const { data } = await api.get<{ data: { organization: Organization } }>(`/organizations/${orgId}`);
  return data.data.organization;
}

export async function getMembers(orgId: string): Promise<Member[]> {
  const { data } = await api.get<{ data: { members: Member[] } }>(`/organizations/${orgId}/members`);
  return data.data.members;
}

export async function getPositions(orgId: string): Promise<PositionWithPermissions[]> {
  const { data } = await api.get<{ data: { positions: PositionWithPermissions[] } }>(
    `/organizations/${orgId}/positions`,
  );
  return data.data.positions;
}

export async function addMember(orgId: string, input: AddMemberInput): Promise<Member> {
  const { data } = await api.post<{ data: { member: Member } }>(`/organizations/${orgId}/members`, input);
  return data.data.member;
}

export async function updateMemberPosition(
  orgId: string,
  memberId: string,
  positionId: string,
): Promise<Member> {
  const { data } = await api.patch<{ data: { member: Member } }>(
    `/organizations/${orgId}/members/${memberId}`,
    { positionId },
  );
  return data.data.member;
}

export async function deactivateMember(orgId: string, memberId: string): Promise<Member> {
  const { data } = await api.delete<{ data: { member: Member } }>(
    `/organizations/${orgId}/members/${memberId}`,
  );
  return data.data.member;
}

export async function updateOrganization(
  orgId: string,
  input: OrganizationFormInput,
): Promise<Organization> {
  const { data } = await api.patch<{ data: { organization: Organization } }>(
    `/organizations/${orgId}`,
    input,
  );
  return data.data.organization;
}

export async function archiveOrganization(orgId: string): Promise<Organization> {
  const { data } = await api.delete<{ data: { organization: Organization } }>(`/organizations/${orgId}`);
  return data.data.organization;
}

export async function createOrganization(
  input: OrganizationFormInput,
): Promise<CreatedOrganizationResult> {
  const { data } = await api.post<{ data: CreatedOrganizationResult }>('/organizations', input);
  return data.data;
}