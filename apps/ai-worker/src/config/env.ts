import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().min(1),

  GEMINI_API_KEY: z.string().min(1),
  AI_SCREENING_MODEL: z.string().default("gemini-3.6-flash"),
  AI_MAX_RESUMES_PER_BATCH: z.coerce.number().default(200),

  GEMINI_EMBEDDING_MODEL: z.string().default("gemini-embedding-2"),

  DRY_RUN: z
    .string()
    .default("false")
    .transform((v) => v === "true"),

  SENTRY_DSN_WORKER: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("[env] Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
