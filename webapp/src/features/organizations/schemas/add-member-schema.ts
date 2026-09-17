import { z } from "zod";

export const addMemberSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  positionId: z.string().min(1, "Select a position."),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;
