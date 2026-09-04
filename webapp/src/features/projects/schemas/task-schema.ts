import { z } from "zod";

export const taskFormSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(120, "Title must be at most 120 characters."),
  description: z.string().trim().max(500, "Description must be at most 500 characters.").optional().default(""),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assigneeName: z.string().trim().max(80).optional().default(""),
  dueDate: z
    .string()
    .optional()
    .default("")
    .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), "Enter a valid date."),
});

export type TaskFormInput = z.infer<typeof taskFormSchema>;
