import { z } from 'zod';

// Matches webapp/src/features/organizations/schemas/organization-form-schema.ts
export const createOrganizationSchema = z.object({
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
  // Accepted for forward compatibility; the backend seeds one default
  // position set regardless of template (FLAG-7: no per-template seeding yet).
  templateId: z.string().optional(),
});

export const updateOrganizationSchema = z.object({
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

export const addMemberSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  positionId: z.string().uuid('Select a position.'),
});

export const updateMemberPositionSchema = z.object({
  positionId: z.string().uuid('Select a position.'),
});

export const activityQuerySchema = z.object({
  entityType: z.enum(['all', 'organization', 'project', 'task', 'member']).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
});
