import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(1).max(200),
  website: z.string().url().optional(),
  industry: z.string().max(100).optional(),
});
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export const verifyCompanySchema = z.object({
  verifiedByAdmin: z.boolean(),
});
export type VerifyCompanyInput = z.infer<typeof verifyCompanySchema>;
