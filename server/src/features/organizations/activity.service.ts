import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import {
  membershipInclude,
  serializeMembership,
  serializeOrganization,
  type SerializedMembership,
  type MemberWithRelations,
} from './memberships';

/**
 * Append-only activity writer + reader (US-4.2). The application layer never
 * updates or deletes ActivityLog rows — enforced by only exposing these two
 * operations (docs/database.md).
 */

export interface ActivityWriteInput {
  organizationId: string;
  organizationMemberId: string;
  action: string;
  entityType: 'organization' | 'project' | 'task' | 'member' | 'proposal';
  entityId: string;
  entityName?: string;
}

type Tx = Pick<typeof prisma, 'activityLog'>;

export async function recordActivity(tx: Tx, input: ActivityWriteInput): Promise<void> {
  await tx.activityLog.create({
    data: {
      organizationId: input.organizationId,
      organizationMemberId: input.organizationMemberId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.entityName ? { entityName: input.entityName } : undefined,
    },
  });
}

export interface SerializedActivityItem {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityName: string;
  createdAt: string;
}

export interface ActivityPage {
  items: SerializedActivityItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export const ACTIVITY_PAGE_SIZE = 5;

export async function listActivity(
  organizationId: string,
  page: number,
  entityType: string,
): Promise<ActivityPage> {
  const where = {
    organizationId,
    ...(entityType !== 'all' ? { entityType } : {}),
  };

  const [totalItems, rows] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      include: { organizationMember: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * ACTIVITY_PAGE_SIZE,
      take: ACTIVITY_PAGE_SIZE,
    }),
  ]);

  const items = rows.map((row) => ({
    id: row.id,
    actorName: [row.organizationMember.user.firstName, row.organizationMember.user.lastName]
      .filter(Boolean)
      .join(' '),
    action: row.action,
    entityType: row.entityType.toLowerCase(),
    entityName:
      typeof row.metadata === 'object' && row.metadata !== null && 'entityName' in row.metadata
        ? String((row.metadata as { entityName: unknown }).entityName)
        : '',
    createdAt: row.createdAt.toISOString(),
  }));

  return {
    items,
    page,
    pageSize: ACTIVITY_PAGE_SIZE,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / ACTIVITY_PAGE_SIZE)),
  };
}

// Dashboard counts (US-4.1). "Open" = every task not yet DONE; overdue =
// open with a past due date (cut-list fallback keeps these static counts).
export async function getDashboardCounts(organizationId: string) {
  const [activeProjects, openTasks, overdueTasks, completedTasks] = await Promise.all([
    prisma.project.count({ where: { organizationId, status: 'ACTIVE' } }),
    prisma.task.count({ where: { project: { organizationId }, status: { not: 'DONE' } } }),
    prisma.task.count({
      where: {
        project: { organizationId },
        status: { not: 'DONE' },
        dueDate: { lt: new Date() },
      },
    }),
    prisma.task.count({ where: { project: { organizationId }, status: 'DONE' } }),
  ]);

  return { activeProjects, openTasks, overdueTasks, completedTasks };
}

// Re-exports keep the service layer as the single import point for
// organization serialization used by members below.
export { serializeMembership, serializeOrganization };
export type { SerializedMembership, MemberWithRelations };
export { membershipInclude };
