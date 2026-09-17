import type { Request, Response } from 'express';
import { ProjectService } from './project.service';
import { TaskService } from './task.service';
import { tasksQuerySchema } from './project.schema';
import { AppError } from '../../middleware/errorHandler';

/**
 * Thin HTTP layer for projects + tasks. Org membership and write permissions
 * are enforced by the route pipeline; handlers pass validated input down
 * and shape the envelope.
 */

function requireOrgContext(req: Request) {
  const ctx = req.orgContext;
  if (!ctx) {
    throw new AppError('Organization context not resolved', 500);
  }
  return ctx;
}

export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly taskService: TaskService,
  ) {}

  listProjects = async (req: Request, res: Response) => {
    const { organizationId } = requireOrgContext(req);
    const result = await this.projectService.list(organizationId);

    return res.status(200).json({
      status: 200,
      message: 'Projects retrieved successfully',
      data: result,
    });
  };

  getProject = async (req: Request, res: Response) => {
    const { organizationId } = requireOrgContext(req);
    const result = await this.projectService.get(organizationId, req.params.projectId);

    return res.status(200).json({
      status: 200,
      message: 'Project retrieved successfully',
      data: result,
    });
  };

  createProject = async (req: Request, res: Response) => {
    const ctx = requireOrgContext(req);
    const result = await this.projectService.create(ctx.organizationId, req.body, {
      organizationMemberId: ctx.membership.id,
    });

    return res.status(201).json({
      status: 201,
      message: 'Project created successfully',
      data: result,
    });
  };

  updateProject = async (req: Request, res: Response) => {
    const ctx = requireOrgContext(req);
    const result = await this.projectService.update(
      ctx.organizationId,
      req.params.projectId,
      req.body,
      { organizationMemberId: ctx.membership.id },
    );

    return res.status(200).json({
      status: 200,
      message: 'Project updated successfully',
      data: result,
    });
  };

  archiveProject = async (req: Request, res: Response) => {
    const ctx = requireOrgContext(req);
    const result = await this.projectService.archive(ctx.organizationId, req.params.projectId, {
      organizationMemberId: ctx.membership.id,
    });

    return res.status(200).json({
      status: 200,
      message: 'Project archived successfully',
      data: result,
    });
  };

  listTasks = async (req: Request, res: Response) => {
    const { organizationId } = requireOrgContext(req);
    // Query-string (not body) validation — validate() middleware parses body only.
    const filters = tasksQuerySchema.parse(req.query);
    const result = await this.taskService.list(organizationId, req.params.projectId, filters);

    return res.status(200).json({
      status: 200,
      message: 'Tasks retrieved successfully',
      data: result,
    });
  };

  createTask = async (req: Request, res: Response) => {
    const ctx = requireOrgContext(req);
    const result = await this.taskService.create(
      ctx.organizationId,
      req.params.projectId,
      req.body,
      { organizationMemberId: ctx.membership.id },
    );

    return res.status(201).json({
      status: 201,
      message: 'Task created successfully',
      data: result,
    });
  };

  updateTaskStatus = async (req: Request, res: Response) => {
    const ctx = requireOrgContext(req);
    const result = await this.taskService.updateStatus(
      ctx.organizationId,
      req.params.projectId,
      req.params.taskId,
      req.body.status,
      { organizationMemberId: ctx.membership.id },
    );

    return res.status(200).json({
      status: 200,
      message: 'Task status updated successfully',
      data: result,
    });
  };
}
