import { PERMISSIONS, type Organization } from "../types";
import type { Member } from "../types/member";
import type { PositionWithPermissions } from "../types/position";

/**
 * TEMPORARY mock data for the organizations feature.
 * Isolated in this file so it can be deleted wholesale once the
 * `/organizations` endpoints exist in the backend.
 */

export const MOCK_LATENCY_MS = 400;

const DAY_IN_MS = 86_400_000;

function isoFromNow(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * DAY_IN_MS).toISOString();
}

export const MOCK_ORGANIZATION: Organization = {
  id: "org-1",
  name: "Northwind Collective",
  description: "A student-led product studio building tools for campus organizations.",
  status: "active",
  createdAt: isoFromNow(210),
  updatedAt: isoFromNow(12),
};

export const MOCK_POSITIONS: PositionWithPermissions[] = [
  {
    id: "pos-president",
    name: "President",
    description: "Full access to the organization.",
    permissions: Object.values(PERMISSIONS),
  },
  {
    id: "pos-vice-president",
    name: "Vice President",
    description: "Manages members and the delivery workflow.",
    permissions: [
      PERMISSIONS.MANAGE_MEMBERS,
      PERMISSIONS.CREATE_PROJECT,
      PERMISSIONS.UPDATE_PROJECT,
      PERMISSIONS.ARCHIVE_PROJECT,
      PERMISSIONS.CREATE_TASK,
      PERMISSIONS.UPDATE_TASK,
      PERMISSIONS.ASSIGN_TASK,
      PERMISSIONS.CREATE_PROPOSAL,
      PERMISSIONS.UPDATE_PROPOSAL,
      PERMISSIONS.SUBMIT_PROPOSAL,
      PERMISSIONS.VIEW_ACTIVITY,
    ],
  },
  {
    id: "pos-secretary",
    name: "Secretary",
    description: "Runs projects and drafts proposals.",
    permissions: [
      PERMISSIONS.CREATE_PROJECT,
      PERMISSIONS.UPDATE_PROJECT,
      PERMISSIONS.CREATE_TASK,
      PERMISSIONS.UPDATE_TASK,
      PERMISSIONS.CREATE_PROPOSAL,
      PERMISSIONS.UPDATE_PROPOSAL,
      PERMISSIONS.VIEW_ACTIVITY,
    ],
  },
  {
    id: "pos-treasurer",
    name: "Treasurer",
    description: "Owns proposals and budget sign-off.",
    permissions: [PERMISSIONS.CREATE_PROPOSAL, PERMISSIONS.UPDATE_PROPOSAL, PERMISSIONS.VIEW_ACTIVITY],
  },
  {
    id: "pos-member",
    name: "Member",
    description: "Read-only access to organization activity.",
    permissions: [PERMISSIONS.VIEW_ACTIVITY],
  },
];

const [PRESIDENT, VICE_PRESIDENT, SECRETARY, TREASURER, MEMBER] = MOCK_POSITIONS;

export const MOCK_MEMBERS: Member[] = [
  {
    id: "mem-1",
    name: "Rui Garrido",
    email: "rui@northwind.co",
    position: PRESIDENT,
    permissions: PRESIDENT.permissions,
    isActive: true,
    joinedAt: isoFromNow(210),
  },
  {
    id: "mem-2",
    name: "Maria Santos",
    email: "maria@northwind.co",
    position: VICE_PRESIDENT,
    permissions: VICE_PRESIDENT.permissions,
    isActive: true,
    joinedAt: isoFromNow(196),
  },
  {
    id: "mem-3",
    name: "James Villanueva",
    email: "james@northwind.co",
    position: SECRETARY,
    permissions: SECRETARY.permissions,
    isActive: true,
    joinedAt: isoFromNow(150),
  },
  {
    id: "mem-4",
    name: "Kaye Mendoza",
    email: "kaye@northwind.co",
    position: TREASURER,
    permissions: TREASURER.permissions,
    isActive: true,
    joinedAt: isoFromNow(120),
  },
  {
    id: "mem-5",
    name: "Paolo Reyes",
    email: "paolo@northwind.co",
    position: MEMBER,
    permissions: MEMBER.permissions,
    isActive: true,
    joinedAt: isoFromNow(60),
  },
  {
    id: "mem-6",
    name: "Ana Lim",
    email: "ana@northwind.co",
    position: MEMBER,
    permissions: MEMBER.permissions,
    isActive: true,
    joinedAt: isoFromNow(30),
  },
  {
    id: "mem-7",
    name: "Carlo Cruz",
    email: "carlo@northwind.co",
    position: MEMBER,
    permissions: MEMBER.permissions,
    isActive: false,
    joinedAt: isoFromNow(180),
  },
];
