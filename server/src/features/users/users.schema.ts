import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters.').max(100),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters.').max(100),
  email: z.string().trim().email('Enter a valid email address.'),
});
