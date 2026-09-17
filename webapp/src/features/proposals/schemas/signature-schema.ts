import { z } from "zod";

export const signatureFormSchema = z.object({
  signatoryName: z.string().trim().min(2, "Name must be at least 2 characters.").max(80, "Name must be at most 80 characters."),
  role: z.string().trim().min(2, "Role must be at least 2 characters.").max(60, "Role must be at most 60 characters."),
});

export type SignatureFormInput = z.infer<typeof signatureFormSchema>;
