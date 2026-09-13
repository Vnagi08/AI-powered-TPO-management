import { z } from "zod";

export const applyToJobSchema = z.object({
  resumeId: z.string().min(1),
});
export type ApplyToJobInput = z.infer<typeof applyToJobSchema>;

export const updateApplicationStatusSchema = z.object({
  status: z.enum([
    "applied",
    "screening",
    "shortlisted",
    "interview",
    "offered",
    "rejected",
    "withdrawn",
  ]),
  note: z.string().max(1000).optional(),
});
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
