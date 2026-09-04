import type {
  Project,
  Task,
  TaskPriority,
  TaskStatus,
} from "../types/project";
import type { ProjectFormInput } from "../schemas/project-schema";
import type { TaskFormInput } from "../schemas/task-schema";
import {
  MOCK_LATENCY_MS,
  MOCK_PROJECTS,
  MOCK_TASKS,
} from "./mock-projects-data";

/**
 * TEMPORARY mock-backed data layer for the projects feature.
 *
 * Signatures match the future API contract so swapping the bodies for
 * real calls through `api` (`@/lib/axios`) requires no changes in the
 * query hooks, components, or types:
 *
 * - getProjects       -> GET   /organizations/:orgId/projects
 * - createProject     -> POST  /organizations/:orgId/projects
 * - getProject        -> GET   /organizations/:orgId/projects/:projectId
 * - updateProject     -> PATCH /organizations/:orgId/projects/:projectId
 * - archiveProject    -> PATCH /organizations/:orgId/projects/:projectId (soft)
 * - getTasks          -> GET   /organizations/:orgId/projects/:projectId/tasks?status=&assigneeId=&page=
 * - createTask        -> POST  /organizations/:orgId/projects/:projectId/tasks
 * - updateTaskStatus  -> PATCH /tasks/:taskId/status
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findProject(projectId: string): Project {
  const project = MOCK_PROJECTS.find((candidate) => candidate.id === projectId);

  if (!project) {
    throw new Error("Project not found.");
  }

  return project;
}

export async function getProjects(_orgId: string): Promise<Project[]> {
  await delay(MOCK_LATENCY_MS);
  return MOCK_PROJECTS.map((project) => ({ ...project }));
}

export async function getProject(_orgId: string, projectId: string): Promise<Project> {
  await delay(MOCK_LATENCY_MS);
  return { ...findProject(projectId) };
}

export async function createProject(_orgId: string, input: ProjectFormInput): Promise<Project> {
  await delay(MOCK_LATENCY_MS);

  const now = new Date().toISOString();
  const project: Project = {
    id: `prj-${Date.now()}`,
    name: input.name,
    description: input.description || null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  MOCK_PROJECTS.push(project);
  return { ...project };
}

export async function updateProject(
  _orgId: string,
  projectId: string,
  input: ProjectFormInput,
): Promise<Project> {
  await delay(MOCK_LATENCY_MS);

  const project = findProject(projectId);
  project.name = input.name;
  project.description = input.description || null;
  project.updatedAt = new Date().toISOString();
  return { ...project };
}

export async function archiveProject(_orgId: string, projectId: string): Promise<Project> {
  await delay(MOCK_LATENCY_MS);

  const project = findProject(projectId);
  project.status = "archived";
  project.updatedAt = new Date().toISOString();
  return { ...project };
}

export async function getTasks(projectId: string): Promise<Task[]> {
  await delay(MOCK_LATENCY_MS);
  return MOCK_TASKS.filter((task) => task.projectId === projectId).map((task) => ({ ...task }));
}

export async function createTask(projectId: string, input: TaskFormInput): Promise<Task> {
  await delay(MOCK_LATENCY_MS);

  const task: Task = {
    id: `task-${Date.now()}`,
    projectId,
    title: input.title,
    description: input.description || null,
    status: "backlog",
    priority: input.priority,
    assigneeName: input.assigneeName || null,
    dueDate: input.dueDate ? new Date(input.dueDate).toISOString() : null,
    createdAt: new Date().toISOString(),
  };

  MOCK_TASKS.push(task);
  return { ...task };
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
  await delay(MOCK_LATENCY_MS);

  const task = MOCK_TASKS.find((candidate) => candidate.id === taskId);

  if (!task) {
    throw new Error("Task not found.");
  }

  task.status = status;
  return { ...task };
}

// Re-exported for the priority select in the task form.
export type { TaskPriority };
