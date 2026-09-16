import { z } from 'zod';

export const TASK_STATUS_VALUES = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const;
export const TASK_PRIORITY_VALUES = ['low', 'medium', 'high'] as const;

// Matches webapp/src/features/projects/schemas/project-schema.ts
export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(80, 'Name must be at most 80 characters.'),
  description: z
    .string()
    .trim()
    .max(280, 'Description must be at most 280 characters.')
    .optional()
    .default(''),
});

export const updateProjectSchema = createProjectSchema;

// Matches webapp/src/features/projects/schemas/task-schema.ts, except the
// assignee travels as a member id (backend resolves the display name) —
// the frontend maps its "" unassigned state to null before POSTing.
export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters.')
    .max(120, 'Title must be at most 120 characters.'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be at most 500 characters.')
    .optional()
    .default(''),
  priority: z.enum(TASK_PRIORITY_VALUES).optional().default('medium'),
  assigneeId: z.string().uuid('Assignee must be an organization member.').nullish().default(null),
  dueDate: z
    .string()
    .optional()
    .default('')
    .refine(
      (value) => value === '' || !Number.isNaN(Date.parse(value)),
      'Enter a valid date.',
    ),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(TASK_STATUS_VALUES),
});

export const tasksQuerySchema = z.object({
  status: z.enum(TASK_STATUS_VALUES).optional(),
  assigneeId: z.string().uuid().optional(),
});
