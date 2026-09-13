import { AiScreeningResult, Application, ApplicationEvent, Job, Resume, StudentProfile, User } from "@tpo/db";
import type { ApplicationStatus } from "@tpo/shared";
import { sendEmail } from "../../config/email.js";
import { AppError } from "../../middleware/errorHandler.js";
import { createNotification } from "../notifications/notifications.service.js";
import { screenApplicationQueue } from "../../queue/queues.js";

async function notifyUser(userId: string, type: string, title: string, body: string) {
  await createNotification(userId, type, title, body);
  const user = await User.findById(userId);
  if (user) {
    await sendEmail({ to: user.get("email"), subject: title, html: `<p>${body}</p>` });
  }
}

// Hard safety cap on one screening trigger — see ARCHITECTURE.md §14 recommendation #2.
// Mirrors apps/ai-worker's AI_MAX_RESUMES_PER_BATCH; kept as a local constant here since
// this is the side that decides batch size (by enqueuing), not the side that spends tokens.
const MAX_RESUMES_PER_SCREENING_BATCH = 200;

// Recruiter/admin-driven forward flow (see ARCHITECTURE.md §9). "withdrawn" is
// deliberately absent here — only the applicant can withdraw their own application.
const FORWARD_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  applied: ["screening", "rejected"],
  screening: ["shortlisted", "rejected"],
  shortlisted: ["interview", "rejected"],
  interview: ["offered", "rejected"],
  offered: [],
  rejected: [],
  withdrawn: [],
};

const WITHDRAWABLE_FROM: ApplicationStatus[] = ["applied", "screening", "shortlisted", "interview"];

async function recordEvent(
  applicationId: string,
  fromStatus: string | null,
  toStatus: string,
  actorUserId: string,
  note?: string,
) {
  await ApplicationEvent.create({ applicationId, fromStatus, toStatus, actorUserId, note });
}

export async function applyToJob(jobId: string, studentUserId: string, resumeId: string) {
  const job = await Job.findById(jobId);
  if (!job || job.get("status") !== "open") {
    throw new AppError(400, "This job is not currently accepting applications");
  }
  if (job.get("applicationDeadline") < new Date()) {
    throw new AppError(400, "The application deadline for this job has passed");
  }

  const profile = await StudentProfile.findOne({ userId: studentUserId });
  if (!profile) {
    throw new AppError(400, "Complete your student profile before applying");
  }

  // Job.eligibleDepartments/eligibleBatchYears/minCgpa (see packages/shared job.schema.ts)
  // are recruiter-set filters — an empty array means "no restriction on this axis".
  const eligibleDepartments = job.get("eligibleDepartments") as string[];
  const eligibleBatchYears = job.get("eligibleBatchYears") as number[];
  const minCgpa = job.get("minCgpa") as number | null | undefined;

  if (eligibleDepartments.length > 0 && !eligibleDepartments.includes(profile.get("department"))) {
    throw new AppError(403, `This job is only open to: ${eligibleDepartments.join(", ")}`);
  }
  if (eligibleBatchYears.length > 0 && !eligibleBatchYears.includes(profile.get("batchYear"))) {
    throw new AppError(403, `This job is only open to batch year(s): ${eligibleBatchYears.join(", ")}`);
  }
  if (minCgpa != null) {
    const cgpa = profile.get("cgpa") as number | null | undefined;
    if (cgpa == null || cgpa < minCgpa) {
      throw new AppError(403, `This job requires a minimum CGPA of ${minCgpa}`);
    }
  }

  const resume = await Resume.findOne({ _id: resumeId, studentId: profile._id });
  if (!resume) {
    throw new AppError(400, "That resume was not found on your profile");
  }

  const existing = await Application.findOne({ jobId, studentId: profile._id });
  if (existing) {
    throw new AppError(409, "You have already applied to this job");
  }

  const application = await Application.create({
    jobId,
    studentId: profile._id,
    resumeId,
    status: "applied",
  });
  await recordEvent(application._id.toString(), null, "applied", studentUserId);

  await notifyUser(
    job.get("postedBy").toString(),
    "new_application",
    "New application received",
    `${profile.get("fullName")} applied to "${job.get("title")}".`,
  );

  return application;
}

export async function listMyApplications(studentUserId: string) {
  const profile = await StudentProfile.findOne({ userId: studentUserId });
  if (!profile) return [];
  return Application.find({ studentId: profile._id })
    .populate("jobId", "title")
    .sort({ createdAt: -1 });
}

async function assertOwnsJob(jobId: string, companyId: string | null) {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError(404, "Job not found");
  }
  if (companyId !== null && job.get("companyId").toString() !== companyId) {
    throw new AppError(403, "You can only manage your own company's jobs");
  }
  return job;
}

export async function listApplicantsForJob(jobId: string, companyId: string | null) {
  await assertOwnsJob(jobId, companyId);
  const applications = await Application.find({ jobId })
    .populate("aiScreeningResultId")
    .sort({ createdAt: -1 });

  // Scored applicants first (highest match on top), unscored ones after —
  // this is the "ranked applicant view" from ARCHITECTURE.md §7.3: sorting by
  // each candidate's individually-explainable score, not a separate ranking call.
  return applications.sort((a, b) => {
    const scoreA = (a.get("aiScreeningResultId") as { matchScore?: number } | null)?.matchScore;
    const scoreB = (b.get("aiScreeningResultId") as { matchScore?: number } | null)?.matchScore;
    if (scoreA === undefined && scoreB === undefined) return 0;
    if (scoreA === undefined) return 1;
    if (scoreB === undefined) return -1;
    return scoreB - scoreA;
  });
}

export async function triggerScreeningForJob(jobId: string, companyId: string | null) {
  const job = await assertOwnsJob(jobId, companyId);

  const applications = await Application.find({
    jobId,
    aiScreeningResultId: { $exists: false },
  }).limit(MAX_RESUMES_PER_SCREENING_BATCH);

  for (const application of applications) {
    await screenApplicationQueue.add("screen-application", {
      applicationId: application._id.toString(),
      jobId: job._id.toString(),
      resumeId: application.get("resumeId").toString(),
    });
  }

  return { enqueued: applications.length };
}

export async function getAiResult(applicationId: string, actor: UpdateStatusActor) {
  const application = await Application.findById(applicationId);
  if (!application) {
    throw new AppError(404, "Application not found");
  }

  if (actor.role === "student") {
    const profile = await StudentProfile.findById(application.get("studentId"));
    if (!profile || profile.get("userId").toString() !== actor.userId) {
      throw new AppError(403, "You can only view your own application results");
    }
  } else {
    await assertOwnsJob(application.get("jobId").toString(), actor.companyId);
  }

  const resultId = application.get("aiScreeningResultId");
  if (!resultId) {
    throw new AppError(404, "This application has not been screened yet");
  }
  const result = await AiScreeningResult.findById(resultId);
  if (!result) {
    throw new AppError(404, "AI screening result not found");
  }
  return result;
}

interface UpdateStatusActor {
  userId: string;
  role: "student" | "recruiter" | "tpo_admin";
  companyId: string | null; // recruiter's own company; null for tpo_admin (no restriction)
}

export async function updateApplicationStatus(
  applicationId: string,
  actor: UpdateStatusActor,
  targetStatus: ApplicationStatus,
  note: string | undefined,
) {
  const application = await Application.findById(applicationId);
  if (!application) {
    throw new AppError(404, "Application not found");
  }
  const currentStatus = application.get("status") as ApplicationStatus;
  const jobId = application.get("jobId").toString();

  let studentProfile;
  if (actor.role === "student") {
    studentProfile = await StudentProfile.findById(application.get("studentId"));
    if (!studentProfile || studentProfile.get("userId").toString() !== actor.userId) {
      throw new AppError(403, "You can only withdraw your own applications");
    }
    if (targetStatus !== "withdrawn") {
      throw new AppError(403, "Students may only withdraw an application");
    }
    if (!WITHDRAWABLE_FROM.includes(currentStatus)) {
      throw new AppError(400, `Cannot withdraw an application in status "${currentStatus}"`);
    }
  } else {
    await assertOwnsJob(jobId, actor.companyId);
    const allowed = FORWARD_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(targetStatus)) {
      throw new AppError(
        400,
        `Cannot move an application from "${currentStatus}" to "${targetStatus}"`,
      );
    }
  }

  application.set("status", targetStatus);
  await application.save();
  await recordEvent(applicationId, currentStatus, targetStatus, actor.userId, note);

  // Drives the placement-rate analytics in Phase 8 — an offer is the signal
  // StudentProfile.placementStatus otherwise never had a writer for.
  if (targetStatus === "offered") {
    await StudentProfile.findByIdAndUpdate(application.get("studentId"), {
      placementStatus: "placed",
    });
  }

  const job = await Job.findById(jobId);
  if (job) {
    if (actor.role === "student") {
      await notifyUser(
        job.get("postedBy").toString(),
        "application_withdrawn",
        "Candidate withdrew their application",
        `An applicant withdrew from "${job.get("title")}".`,
      );
    } else {
      studentProfile ??= await StudentProfile.findById(application.get("studentId"));
      if (studentProfile) {
        await notifyUser(
          studentProfile.get("userId").toString(),
          "status_change",
          "Your application status changed",
          `Your application to "${job.get("title")}" is now "${targetStatus}".`,
        );
      }
    }
  }

  return application;
}
