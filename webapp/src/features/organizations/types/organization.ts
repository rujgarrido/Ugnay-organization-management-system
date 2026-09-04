export const PERMISSIONS = {
  CREATE_ORGANIZATION: "CREATE_ORGANIZATION",
  MANAGE_MEMBERS: "MANAGE_MEMBERS",
  MANAGE_POSITIONS: "MANAGE_POSITIONS",
  MANAGE_COMMITTEES: "MANAGE_COMMITTEES",
  CREATE_PROJECT: "CREATE_PROJECT",
  UPDATE_PROJECT: "UPDATE_PROJECT",
  ARCHIVE_PROJECT: "ARCHIVE_PROJECT",
  CREATE_TASK: "CREATE_TASK",
  UPDATE_TASK: "UPDATE_TASK",
  ASSIGN_TASK: "ASSIGN_TASK",
  CREATE_PROPOSAL: "CREATE_PROPOSAL",
  UPDATE_PROPOSAL: "UPDATE_PROPOSAL",
  SUBMIT_PROPOSAL: "SUBMIT_PROPOSAL",
  VIEW_ACTIVITY: "VIEW_ACTIVITY",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type OrganizationStatus = "active" | "archived";

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  /** Present once the backend exposes the organization lifecycle; mocked for now. */
  status?: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  name: string;
  description: string | null;
}

export interface OrganizationMembership {
  id: string;
  organization: Organization;
  position: Position;
  permissions: PermissionCode[];
  isActive: boolean;
  joinedAt: string;
  removedAt: string | null;
}

export function hasPermission(
  membership: OrganizationMembership | null | undefined,
  permission: PermissionCode,
): boolean {
  return membership?.isActive === true && membership.permissions.includes(permission);
}
