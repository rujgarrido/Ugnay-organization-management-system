import type { TaskStatus } from "@/features/projects/types/project";

export type ActivityEntityType = "organization" | "project" | "task" | "member";

export type ActivityEntityTypeFilter = ActivityEntityType | "all";

export interface DashboardCounts {
  activeProjects: number;
  openTasks: number;
  overdueTasks: number;
  completedTasks: number;
}

export interface DashboardOverview extends DashboardCounts {
  /** Task counts per status, always keyed by every task status. */
  tasksByStatus: Record<TaskStatus, number>;
}

export interface ActivityItem {
  id: string;
  actorName: string;
  action: string;
  entityType: ActivityEntityType;
  entityName: string;
  createdAt: string;
}

export interface ActivityPage {
  items: ActivityItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
