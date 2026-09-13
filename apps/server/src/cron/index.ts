import cron from "node-cron";
import { logger } from "../config/logger.js";
import { runRecruiterDigest } from "./recruiterDigest.js";

/**
 * Cron lives in the API server, not apps/ai-worker, despite ARCHITECTURE.md §9
 * originally sketching it as a worker concern — the digest needs email
 * (RESEND_API_KEY), which only the server holds under our AI-key isolation
 * split (worker = GEMINI_API_KEY for generation only). See ARCHITECTURE.md §14.
 */
export function startCronJobs(): void {
  // Daily at 08:00 server time. Call runRecruiterDigest() directly to test
  // without waiting for the schedule.
  cron.schedule("0 8 * * *", () => {
    runRecruiterDigest().catch((err) => logger.error({ err }, "Recruiter digest cron failed"));
  });
  logger.info("Cron jobs scheduled (recruiter digest: daily 08:00)");
}
