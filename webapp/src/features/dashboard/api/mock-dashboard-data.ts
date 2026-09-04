import type { ActivityItem, DashboardOverview } from "../types/dashboard";

/**
 * TEMPORARY mock data for the dashboard (US-4.1 / US-4.2 — Sprint 2).
 * Isolated in this file so it can be deleted wholesale once
 * `GET /organizations/:orgId/dashboard` and
 * `GET /organizations/:orgId/activity` exist in the backend.
 */

export const MOCK_LATENCY_MS = 400;
export const MOCK_ACTIVITY_PAGE_SIZE = 5;

const HOUR_IN_MS = 3_600_000;

function isoFromNow(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * HOUR_IN_MS).toISOString();
}

export const MOCK_DASHBOARD_OVERVIEW: DashboardOverview = {
  activeProjects: 5,
  openTasks: 18,
  overdueTasks: 3,
  completedTasks: 42,
};

export const MOCK_ACTIVITY_ITEMS: ActivityItem[] = [
  {
    id: "act-001",
    actorName: "Maria Santos",
    action: "moved task",
    entityType: "task",
    entityName: "Finalize Q3 investor deck",
    createdAt: isoFromNow(0.4),
  },
  {
    id: "act-002",
    actorName: "James Villanueva",
    action: "completed task",
    entityType: "task",
    entityName: "Update onboarding checklist",
    createdAt: isoFromNow(2),
  },
  {
    id: "act-003",
    actorName: "Maria Santos",
    action: "created project",
    entityType: "project",
    entityName: "Website Redesign",
    createdAt: isoFromNow(5),
  },
  {
    id: "act-004",
    actorName: "Rui Garrido",
    action: "added member",
    entityType: "member",
    entityName: "Kaye Mendoza",
    createdAt: isoFromNow(26),
  },
  {
    id: "act-005",
    actorName: "Kaye Mendoza",
    action: "created task",
    entityType: "task",
    entityName: "Draft content calendar",
    createdAt: isoFromNow(30),
  },
  {
    id: "act-006",
    actorName: "Rui Garrido",
    action: "archived project",
    entityType: "project",
    entityName: "2026 Recruitment Drive",
    createdAt: isoFromNow(50),
  },
  {
    id: "act-007",
    actorName: "James Villanueva",
    action: "updated task",
    entityType: "task",
    entityName: "Prepare venue shortlist",
    createdAt: isoFromNow(74),
  },
  {
    id: "act-008",
    actorName: "Maria Santos",
    action: "created organization",
    entityType: "organization",
    entityName: "Northwind Collective",
    createdAt: isoFromNow(120),
  },
];
