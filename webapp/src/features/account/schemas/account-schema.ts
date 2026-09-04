import { z } from "zod";

export const accountSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(60, "First name must be at most 60 characters."),
  lastName: z.string().trim().min(1, "Last name is required.").max(60, "Last name must be at most 60 characters."),
  email: z.string().trim().email("Enter a valid email address."),
});

export type AccountInput = z.infer<typeof accountSchema>;
