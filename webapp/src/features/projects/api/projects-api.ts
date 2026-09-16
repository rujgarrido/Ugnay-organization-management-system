import { api } from "@/lib/axios";
import type { Project, Task, TaskStatus } from "../types/project";
import type { ProjectFormInput } from "../schemas/project-schema";
import type { TaskFormInput } from "../schemas/task-schema";

/**
 * Real data layer for projects + tasks (US-3.1 / US-3.2 / US-3.3).
 * Backend routes: /organizations/:orgId/projects[/:projectId[/tasks]].
 * Every call is org-scoped and authorized server-side; archive is soft.
 */

export async function getProjects(orgId: string): Promise<Project[]> {
  const { data } = await api.get<{ data: { projects: Project[] } }>(
    `/organizations/${orgId}/projects`,
  );
  return data.data.projects;
}

export async function getProject(orgId: string, projectId: string): Promise<Project> {
  const { data } = await api.get<{ data: { project: Project } }>(
    `/organizations/${orgId}/projects/${projectId}`,
  );
  return data.data.project;
}

export async function createProject(orgId: string, input: ProjectFormInput): Promise<Project> {
  const { data } = await api.post<{ data: { project: Project } }>(
    `/organizations/${orgId}/projects`,
    { name: input.name, description: input.description },
  );
  return data.data.project;
}

export async function updateProject(
  orgId: string,
  projectId: string,
  input: ProjectFormInput,
): Promise<Project> {
  const { data } = await api.patch<{ data: { project: Project } }>(
    `/organizations/${orgId}/projects/${projectId}`,
    { name: input.name, description: input.description },
  );
  return data.data.project;
}

/** Soft archive — the backend never deletes project rows. */
export async function archiveProject(orgId: string, projectId: string): Promise<Project> {
  const { data } = await api.delete<{ data: { project: Project } }>(
    `/organizations/${orgId}/projects/${projectId}`,
  );
  return data.data.project;
}

export async function getTasks(orgId: string, projectId: string): Promise<Task[]> {
  const { data } = await api.get<{ data: { tasks: Task[] } }>(
    `/organizations/${orgId}/projects/${projectId}/tasks`,
  );
  return data.data.tasks;
}

export async function createTask(
  orgId: string,
  projectId: string,
  input: TaskFormInput,
): Promise<Task> {
  const { data } = await api.post<{ data: { task: Task } }>(
    `/organizations/${orgId}/projects/${projectId}/tasks`,
    {
      title: input.title,
      description: input.description,
      priority: input.priority,
      assigneeId: input.assigneeId || null,
      dueDate: input.dueDate,
    },
  );
  return data.data.task;
}

export async function updateTaskStatus(
  orgId: string,
  projectId: string,
  taskId: string,
  status: TaskStatus,
): Promise<Task> {
  const { data } = await api.patch<{ data: { task: Task } }>(
    `/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/status`,
    { status },
  );
  return data.data.task;
}
