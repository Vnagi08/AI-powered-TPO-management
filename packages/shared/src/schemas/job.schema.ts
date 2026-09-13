import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  jdText: z.string().min(1),
  requiredSkills: z.array(z.string()).default([]),
  minCgpa: z.number().min(0).max(10).optional(),
  eligibleDepartments: z.array(z.string()).default([]),
  eligibleBatchYears: z.array(z.number()).default([]),
  location: z.string().optional(),
  employmentType: z.enum(["full_time", "internship", "contract"]).default("full_time"),
  applicationDeadline: z.coerce.date(),
});
export type CreateJobInput = z.infer<typeof createJobSchema>;

export const updateJobSchema = createJobSchema.partial();
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
