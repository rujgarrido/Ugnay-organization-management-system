export type ActivityEntityType = "organization" | "project" | "task" | "member";

export type ActivityEntityTypeFilter = ActivityEntityType | "all";

export interface DashboardOverview {
  activeProjects: number;
  openTasks: number;
  overdueTasks: number;
  completedTasks: number;
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
