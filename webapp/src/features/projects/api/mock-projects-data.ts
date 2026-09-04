import type { Project, Task, TaskPriority, TaskStatus } from "../types/project";

/**
 * TEMPORARY mock data for the projects feature.
 * Isolated in this file so it can be deleted wholesale once the
 * `/organizations/:orgId/projects` and `/tasks` endpoints exist.
 */

export const MOCK_LATENCY_MS = 400;

const DAY_IN_MS = 86_400_000;

function isoFromNow(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * DAY_IN_MS).toISOString();
}

function isoAhead(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * DAY_IN_MS).toISOString();
}

export const MOCK_PROJECTS: Project[] = [
  {
    id: "prj-1",
    name: "Website Redesign",
    description: "Refresh the public site with the new brand system.",
    status: "active",
    createdAt: isoFromNow(40),
    updatedAt: isoFromNow(2),
  },
  {
    id: "prj-2",
    name: "Recruitment Drive 2026",
    description: "Outreach, interviews, and onboarding for the new cohort.",
    status: "active",
    createdAt: isoFromNow(28),
    updatedAt: isoFromNow(5),
  },
  {
    id: "prj-3",
    name: "Mobile App MVP",
    description: "Companion app for members to track tasks on the go.",
    status: "active",
    createdAt: isoFromNow(21),
    updatedAt: isoFromNow(1),
  },
  {
    id: "prj-4",
    name: "Q3 Fundraising Gala",
    description: "Venue, sponsors, and program for the annual gala.",
    status: "active",
    createdAt: isoFromNow(14),
    updatedAt: isoFromNow(3),
  },
  {
    id: "prj-5",
    name: "2025 Recruitment Drive",
    description: "Last cycle's recruitment campaign.",
    status: "archived",
    createdAt: isoFromNow(200),
    updatedAt: isoFromNow(90),
  },
];

interface TaskSeed {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeName: string | null;
  dueInDays: number | null;
}

const TASK_SEEDS: Record<string, TaskSeed[]> = {
  "prj-1": [
    { title: "Audit current site content", description: null, status: "done", priority: "medium", assigneeName: "James Villanueva", dueInDays: -10 },
    { title: "Finalize design tokens", description: "Colors, spacing, and type scale.", status: "done", priority: "high", assigneeName: "Maria Santos", dueInDays: -6 },
    { title: "Build landing page hero", description: null, status: "review", priority: "high", assigneeName: "Paolo Reyes", dueInDays: 2 },
    { title: "Migrate blog posts", description: null, status: "in_progress", priority: "medium", assigneeName: "Ana Lim", dueInDays: 5 },
    { title: "Set up analytics", description: null, status: "in_progress", priority: "low", assigneeName: "Maria Santos", dueInDays: 7 },
    { title: "Write accessibility checklist", description: null, status: "todo", priority: "medium", assigneeName: null, dueInDays: 9 },
    { title: "Prepare launch comms", description: null, status: "todo", priority: "low", assigneeName: "James Villanueva", dueInDays: 12 },
    { title: "Collect testimonials", description: null, status: "backlog", priority: "low", assigneeName: null, dueInDays: null },
    { title: "Spike CMS alternatives", description: null, status: "backlog", priority: "medium", assigneeName: "Paolo Reyes", dueInDays: null },
    { title: "Fix mobile nav overflow", description: "Menu clips on narrow screens.", status: "todo", priority: "high", assigneeName: "Ana Lim", dueInDays: 3 },
  ],
  "prj-2": [
    { title: "Draft recruitment poster", description: null, status: "review", priority: "high", assigneeName: "Maria Santos", dueInDays: 1 },
    { title: "Shortlist applicant pool", description: null, status: "in_progress", priority: "high", assigneeName: "Rui Garrido", dueInDays: 4 },
    { title: "Schedule interview panels", description: null, status: "todo", priority: "medium", assigneeName: "Kaye Mendoza", dueInDays: 6 },
    { title: "Prepare onboarding packets", description: null, status: "backlog", priority: "low", assigneeName: null, dueInDays: null },
  ],
};

export const MOCK_TASKS: Task[] = Object.entries(TASK_SEEDS).flatMap(([projectId, seeds]) =>
  seeds.map((seed, index) => ({
    id: `task-${projectId}-${index + 1}`,
    projectId,
    title: seed.title,
    description: seed.description,
    status: seed.status,
    priority: seed.priority,
    assigneeName: seed.assigneeName,
    dueDate: seed.dueInDays === null ? null : (seed.dueInDays >= 0 ? isoAhead(seed.dueInDays) : isoFromNow(-seed.dueInDays)),
    createdAt: isoFromNow(14 - index),
  })),
);
