import { Application, Job, User } from "@tpo/db";
import { sendEmail } from "../config/email.js";
import { logger } from "../config/logger.js";
import { createNotification } from "../modules/notifications/notifications.service.js";

/**
 * One notification per open job that still has applicants sitting in "applied"
 * (i.e. nobody has screened or triaged them yet) — nudges the recruiter to act.
 * Exported separately from the cron schedule below so it's directly testable/
 * triggerable without waiting for the real cadence. See ARCHITECTURE.md §9.
 */
export async function runRecruiterDigest(): Promise<{ notified: number }> {
  const openJobs = await Job.find({ status: "open" });
  let notified = 0;

  for (const job of openJobs) {
    const pendingCount = await Application.countDocuments({ jobId: job._id, status: "applied" });
    if (pendingCount === 0) continue;

    const recruiter = await User.findById(job.get("postedBy"));
    if (!recruiter) continue;

    const title = "Applications awaiting review";
    const body = `"${job.get("title")}" has ${pendingCount} applicant(s) still awaiting review.`;
    await createNotification(recruiter._id.toString(), "digest", title, body);
    await sendEmail({ to: recruiter.get("email"), subject: title, html: `<p>${body}</p>` });
    notified++;
  }

  logger.info({ notified }, "Recruiter digest run complete");
  return { notified };
}
