import { z } from "zod";

/**
 * Structured resume extraction shape — used as the Gemini JSON-mode output
 * schema in apps/ai-worker AND as the read-side type for resume.parsedData
 * in apps/server. Keeping this in packages/shared is what keeps both in sync.
 * year/durationMonths are nullable (not just optional) because Gemini's JSON
 * mode fills unknown fields with `null` rather than omitting them.
 */
export const ResumeDataSchema = z.object({
  skills: z.array(z.string()),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string(),
      year: z.number().nullable().optional(),
    }),
  ),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      durationMonths: z.number().nullable().optional(),
      summary: z.string(),
    }),
  ),
  totalExperienceMonths: z.number(),
});
export type ResumeData = z.infer<typeof ResumeDataSchema>;

/**
 * JD-fit scoring output shape — same idea, shared between the worker
 * (Claude structured-output schema) and the server (ai_screening_results shape).
 */
export const ScoreSchema = z.object({
  matchScore: z.number().min(0).max(100),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  reasoning: z.string().max(500),
  recommendation: z.enum(["strong_fit", "possible_fit", "not_a_fit"]),
});
export type ResumeScore = z.infer<typeof ScoreSchema>;
