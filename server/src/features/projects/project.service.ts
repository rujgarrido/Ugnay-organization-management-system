import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { recordActivity } from '../organizations/activity.service';

/**
 * Projects (US-3.1 / US-3.3). Every method is org-scoped: the project must
 * belong to the caller's organization or it 404s (no cross-org leakage).
 * Archive is soft — rows are never deleted.
 */

export interface SerializedProject {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeProject(project: ProjectRow): SerializedProject {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status === 'ARCHIVED' ? 'archived' : 'active',
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

/** 404 unless the project belongs to the given organization. */
export async function findProjectInOrg(
  organizationId: string,
  projectId: string,
): Promise<ProjectRow> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  return project as ProjectRow;
}

export class ProjectService {
  async list(organizationId: string) {
    const projects = await prisma.project.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
    });

    return { projects: projects.map((project) => serializeProject(project as ProjectRow)) };
  }

  async get(organizationId: string, projectId: string) {
    const project = await findProjectInOrg(organizationId, projectId);
    return { project: serializeProject(project) };
  }

  async create(
    organizationId: string,
    input: { name: string; description: string },
    ctx: { organizationMemberId: string },
  ) {
    const project = await prisma.$transaction(async (tx) => {
      const row = await tx.project.create({
        data: {
          organizationId,
          name: input.name,
          description: input.description || null,
          createdById: ctx.organizationMemberId,
        },
      });

      await recordActivity(tx, {
        organizationId,
        organizationMemberId: ctx.organizationMemberId,
        action: 'created project',
        entityType: 'project',
        entityId: row.id,
        entityName: row.name,
      });

      return row;
    });

    return { project: serializeProject(project as ProjectRow) };
  }

  async update(
    organizationId: string,
    projectId: string,
    input: { name: string; description: string },
    ctx: { organizationMemberId: string },
  ) {
    await findProjectInOrg(organizationId, projectId);

    const project = await prisma.$transaction(async (tx) => {
      const row = await tx.project.update({
        where: { id: projectId },
        data: { name: input.name, description: input.description || null },
      });

      await recordActivity(tx, {
        organizationId,
        organizationMemberId: ctx.organizationMemberId,
        action: 'updated project',
        entityType: 'project',
        entityId: row.id,
        entityName: row.name,
      });

      return row;
    });

    return { project: serializeProject(project as ProjectRow) };
  }

  async archive(
    organizationId: string,
    projectId: string,
    ctx: { organizationMemberId: string },
  ) {
    await findProjectInOrg(organizationId, projectId);

    const project = await prisma.$transaction(async (tx) => {
      const row = await tx.project.update({
        where: { id: projectId },
        data: { status: 'ARCHIVED' },
      });

      await recordActivity(tx, {
        organizationId,
        organizationMemberId: ctx.organizationMemberId,
        action: 'archived project',
        entityType: 'project',
        entityId: row.id,
        entityName: row.name,
      });

      return row;
    });

    return { project: serializeProject(project as ProjectRow) };
  }
}
