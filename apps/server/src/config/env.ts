import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CLIENT_ORIGIN: z.string().url(),

  // This app is a deployable template — one instance per college, own database,
  // own domain (see DEPLOYMENT.md). COLLEGE_NAME is the only branding the server
  // needs (email templates); everything UI-facing is VITE_COLLEGE_NAME on the client.
  COLLEGE_NAME: z.string().default("TPO Platform"),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("30d"),

  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().min(1),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Zero-domain email fallback (see DEPLOYMENT.md §4a) — used only when
  // RESEND_API_KEY is unset. A Gmail address + an App Password (Google Account
  // > Security > App Passwords, requires 2-Step Verification), not the real
  // account password.
  // Not .email() — an empty string in .env (unset) would otherwise fail validation
  // instead of being treated as absent, unlike EMAIL_FROM which always has a value.
  GMAIL_USER: z.string().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),

  // Query-embedding only (semantic search) — see src/ai/geminiClient.ts for why
  // this is the one AI credential the server holds. Falls back to a fixture
  // embedding when unset, so search works in dev without a Gemini account.
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_EMBEDDING_MODEL: z.string().default("gemini-embedding-2"),

  SENTRY_DSN_SERVER: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("[env] Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
