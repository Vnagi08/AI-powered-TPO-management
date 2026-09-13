import { z } from "zod";

export const studentProfileSchema = z.object({
  rollNumber: z.string().min(1).max(50),
  department: z.string().min(1).max(100),
  batchYear: z.number().int().min(2000).max(2100),
  cgpa: z.number().min(0).max(10).optional(),
  phone: z.string().max(20).optional(),
  skills: z.array(z.string()).default([]),
});
export type StudentProfileInput = z.infer<typeof studentProfileSchema>;

export const recruiterProfileSchema = z.object({
  companyId: z.string().min(1),
  designation: z.string().max(150).optional(),
});
export type RecruiterProfileInput = z.infer<typeof recruiterProfileSchema>;
