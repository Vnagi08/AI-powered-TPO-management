import { z } from "zod";

export const searchResumesSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(50).default(10),
});
export type SearchResumesInput = z.infer<typeof searchResumesSchema>;
