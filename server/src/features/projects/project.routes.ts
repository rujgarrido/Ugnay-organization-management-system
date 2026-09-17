import { Router } from 'express';
import { ProjectController } from './project.controller';
import { catchAsync } from '../../middleware/asyncHandler';
import { validate } from '../../middleware/validate';
import { apiRateLimiter } from '../../middleware/rateLimiter';
import { authenticate } from '../../middleware/auth.middleware';
import { csrfProtection } from '../../middleware/csrf';
import { resolveOrgContext } from '../../middleware/resolveOrgContext';
import { requirePermission } from '../../middleware/requirePermission';
import { requireUuidParam } from '../../middleware/validateUuidParam';
import {
  createProjectSchema,
  updateProjectSchema,
  createTaskSchema,
  updateTaskStatusSchema,
} from './project.schema';

/**
 * US-3.1 / US-3.3 — project + task routes, mounted at
 * `/api/v1/organizations/:orgId/...`. Reads need membership only; writes
 * are staged by capability (CREATE_PROJECT / UPDATE_PROJECT /
 * ARCHIVE_PROJECT / CREATE_TASK / UPDATE_TASK).
 */
export const projectRoutes = (controller: ProjectController): Router => {
  const router = Router();

  // Malformed uuid params become 404s before they reach Prisma (see guard).
  router.param('orgId', requireUuidParam('Organization'));
  router.param('projectId', requireUuidParam('Project'));
  router.param('taskId', requireUuidParam('Task'));

  router.use('/:orgId', authenticate, catchAsync(resolveOrgContext));

  // US-3.1 — projects
  router.get('/:orgId/projects', catchAsync(controller.listProjects));
  router.post(
    '/:orgId/projects',
    csrfProtection,
    apiRateLimiter,
    requirePermission('CREATE_PROJECT'),
    validate(createProjectSchema),
    catchAsync(controller.createProject),
  );
  router.get('/:orgId/projects/:projectId', catchAsync(controller.getProject));
  router.patch(
    '/:orgId/projects/:projectId',
    csrfProtection,
    apiRateLimiter,
    requirePermission('UPDATE_PROJECT'),
    validate(updateProjectSchema),
    catchAsync(controller.updateProject),
  );
  router.delete(
    '/:orgId/projects/:projectId',
    csrfProtection,
    apiRateLimiter,
    requirePermission('ARCHIVE_PROJECT'),
    catchAsync(controller.archiveProject),
  );

  // US-3.2 / US-3.3 — tasks (nested under the project)
  router.get('/:orgId/projects/:projectId/tasks', catchAsync(controller.listTasks));
  router.post(
    '/:orgId/projects/:projectId/tasks',
    csrfProtection,
    apiRateLimiter,
    requirePermission('CREATE_TASK'),
    validate(createTaskSchema),
    catchAsync(controller.createTask),
  );
  router.patch(
    '/:orgId/projects/:projectId/tasks/:taskId/status',
    csrfProtection,
    apiRateLimiter,
    requirePermission('UPDATE_TASK'),
    validate(updateTaskStatusSchema),
    catchAsync(controller.updateTaskStatus),
  );

  return router;
};
