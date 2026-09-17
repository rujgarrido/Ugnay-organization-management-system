import { z } from "zod";

export const projectFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80, "Name must be at most 80 characters."),
  description: z.string().trim().max(280, "Description must be at most 280 characters.").optional().default(""),
});

export type ProjectFormInput = z.infer<typeof projectFormSchema>;
