import { z } from "zod";

export const proposalFormSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(120, "Title must be at most 120 characters."),
  description: z.string().trim().max(500, "Description must be at most 500 characters.").optional().default(""),
});

export type ProposalFormInput = z.infer<typeof proposalFormSchema>;
