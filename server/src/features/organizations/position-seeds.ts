/**
 * Seed definitions for a freshly created organization (US-2.2). The codes
 * mirror webapp/src/features/organizations/types/organization.ts PERMISSIONS.
 * `President` (the creator's position) intentionally holds every code.
 */
export const PERMISSION_CODES = [
  'CREATE_ORGANIZATION',
  'MANAGE_MEMBERS',
  'MANAGE_POSITIONS',
  'MANAGE_COMMITTEES',
  'CREATE_PROJECT',
  'UPDATE_PROJECT',
  'ARCHIVE_PROJECT',
  'CREATE_TASK',
  'UPDATE_TASK',
  'ASSIGN_TASK',
  'CREATE_PROPOSAL',
  'UPDATE_PROPOSAL',
  'SUBMIT_PROPOSAL',
  'VIEW_ACTIVITY',
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

export interface PositionSeed {
  name: string;
  description: string;
  permissions: readonly string[];
}

export const DEFAULT_POSITIONS: readonly PositionSeed[] = [
  {
    name: 'President',
    description: 'Full access to the organization.',
    permissions: PERMISSION_CODES,
  },
  {
    name: 'Vice President',
    description: 'Manages members and the delivery workflow.',
    permissions: [
      'MANAGE_MEMBERS',
      'CREATE_PROJECT',
      'UPDATE_PROJECT',
      'ARCHIVE_PROJECT',
      'CREATE_TASK',
      'UPDATE_TASK',
      'ASSIGN_TASK',
      'CREATE_PROPOSAL',
      'UPDATE_PROPOSAL',
      'SUBMIT_PROPOSAL',
      'VIEW_ACTIVITY',
    ],
  },
  {
    name: 'Secretary',
    description: 'Runs projects and drafts proposals.',
    permissions: [
      'CREATE_PROJECT',
      'UPDATE_PROJECT',
      'CREATE_TASK',
      'UPDATE_TASK',
      'CREATE_PROPOSAL',
      'UPDATE_PROPOSAL',
      'VIEW_ACTIVITY',
    ],
  },
  {
    name: 'Treasurer',
    description: 'Owns proposals and budget sign-off.',
    permissions: ['CREATE_PROPOSAL', 'UPDATE_PROPOSAL', 'VIEW_ACTIVITY'],
  },
  {
    name: 'Member',
    description: 'Read-only access to organization activity.',
    permissions: ['VIEW_ACTIVITY'],
  },
];
