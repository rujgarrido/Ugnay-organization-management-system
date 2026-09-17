import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { recordActivity } from '../organizations/activity.service';
import { findProjectInOrg } from './project.service';

/**
 * Tasks (US-3.2 / US-3.3). Status and priority enums are UPPERCASE in the
 * database and lowercase on the wire — mapped here, in one place.
 * Assignees are organization members; the wire type keeps the display name
 * (`assigneeName`) the board already renders.
 */

const TO_DB_STATUS = {
  backlog: 'BACKLOG',
  todo: 'TODO',
  in_progress: 'IN_PROGRESS',
  review: 'REVIEW',
  done: 'DONE',
} as const;

const TO_DB_PRIORITY = { low: 'LOW', medium: 'MEDIUM', high: 'HIGH' } as const;

export interface SerializedTask {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: keyof typeof TO_DB_STATUS;
  priority: keyof typeof TO_DB_PRIORITY;
  assigneeName: string | null;
  dueDate: string | null;
  createdAt: string;
}

type TaskRow = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  createdAt: Date;
  assignee: { user: { firstName: string; lastName: string } } | null;
};

const taskInclude = { assignee: { include: { user: true } } } as const;

export function serializeTask(task: TaskRow): SerializedTask {
  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    status: task.status.toLowerCase() as SerializedTask['status'],
    priority: task.priority.toLowerCase() as SerializedTask['priority'],
    assigneeName: task.assignee
      ? [task.assignee.user.firstName, task.assignee.user.lastName].filter(Boolean).join(' ')
      : null,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
  };
}

async function findTaskInProject(
  organizationId: string,
  projectId: string,
  taskId: string,
): Promise<TaskRow> {
  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId, project: { organizationId } },
    include: taskInclude,
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  return task as unknown as TaskRow;
}

export class TaskService {
  async list(
    organizationId: string,
    projectId: string,
    filters: { status?: keyof typeof TO_DB_STATUS; assigneeId?: string },
  ) {
    await findProjectInOrg(organizationId, projectId);

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        ...(filters.status ? { status: TO_DB_STATUS[filters.status] as never } : {}),
        ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
      },
      include: taskInclude,
      orderBy: { createdAt: 'asc' },
    });

    return { tasks: tasks.map((task) => serializeTask(task as unknown as TaskRow)) };
  }

  async create(
    organizationId: string,
    projectId: string,
    input: {
      title: string;
      description: string;
      priority: keyof typeof TO_DB_PRIORITY;
      assigneeId: string | null;
      dueDate: string;
    },
    ctx: { organizationMemberId: string },
  ) {
    const project = await findProjectInOrg(organizationId, projectId);

    if (project.status === 'ARCHIVED') {
      throw new AppError('Cannot add tasks to an archived project.', 409);
    }

    if (input.assigneeId) {
      const assignee = await prisma.organizationMember.findFirst({
        where: { id: input.assigneeId, organizationId, isActive: true },
      });
      if (!assignee) {
        throw new AppError('Assignee must be an active member of the organization.', 404);
      }
    }

    const task = await prisma.$transaction(async (tx) => {
      const row = await tx.task.create({
        data: {
          projectId,
          title: input.title,
          description: input.description || null,
          status: 'BACKLOG',
          priority: TO_DB_PRIORITY[input.priority] as never,
          assigneeId: input.assigneeId,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          createdById: ctx.organizationMemberId,
        },
        include: taskInclude,
      });

      await recordActivity(tx, {
        organizationId,
        organizationMemberId: ctx.organizationMemberId,
        action: 'created task',
        entityType: 'task',
        entityId: row.id,
        entityName: row.title,
      });

      return row;
    });

    return { task: serializeTask(task as unknown as TaskRow) };
  }

  async updateStatus(
    organizationId: string,
    projectId: string,
    taskId: string,
    status: keyof typeof TO_DB_STATUS,
    ctx: { organizationMemberId: string },
  ) {
    const task = await findTaskInProject(organizationId, projectId, taskId);

    if (task.status === TO_DB_STATUS[status]) {
      return { task: serializeTask(task) };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.task.update({
        where: { id: task.id },
        data: { status: TO_DB_STATUS[status] as never },
        include: taskInclude,
      });

      await recordActivity(tx, {
        organizationId,
        organizationMemberId: ctx.organizationMemberId,
        action: status === 'done' ? 'completed task' : 'moved task',
        entityType: 'task',
        entityId: row.id,
        entityName: row.title,
      });

      return row;
    });

    return { task: serializeTask(updated as unknown as TaskRow) };
  }
}
