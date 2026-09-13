import type { ResumeData, ResumeScore, ScreenApplicationJobData } from "@tpo/shared";
import { AiScreeningResult, Application, Job, Resume } from "@tpo/db";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { scoreResumeAgainstJob } from "../../pipeline/scoring/scoreResumeAgainstJob.js";

/**
 * Stands in for the real Gemini call when DRY_RUN=true — computes a real (if
 * naive) score from skill-list overlap so the ranked-applicant UI has something
 * meaningful to sort/show without a Gemini API key. See ARCHITECTURE.md §14.
 */
function buildFixtureScore(requiredSkills: string[], candidateSkills: string[]): ResumeScore {
  const normalize = (s: string) => s.trim().toLowerCase();
  const required = new Set(requiredSkills.map(normalize));
  const candidate = new Set(candidateSkills.map(normalize));
  const matched = [...required].filter((s) => candidate.has(s));
  const missing = [...required].filter((s) => !candidate.has(s));

  const matchScore = required.size === 0 ? 50 : Math.round((matched.length / required.size) * 100);
  const recommendation: ResumeScore["recommendation"] =
    matchScore >= 80 ? "strong_fit" : matchScore >= 40 ? "possible_fit" : "not_a_fit";

  return {
    matchScore,
    matchedSkills: matched,
    missingSkills: missing,
    reasoning: `DRY_RUN fixture — matched ${matched.length}/${required.size || "0"} required skills by exact-text overlap (no real model call).`,
    recommendation,
  };
}

export async function processScreenApplication(data: ScreenApplicationJobData): Promise<void> {
  const [application, job, resume] = await Promise.all([
    Application.findById(data.applicationId),
    Job.findById(data.jobId),
    Resume.findById(data.resumeId),
  ]);

  if (!application || !job || !resume?.parsedData) {
    logger.warn({ data }, "Missing application/job/parsed resume data, skipping screening job");
    return;
  }

  if (application.get("aiScreeningResultId")) {
    logger.info({ applicationId: data.applicationId }, "Already screened, skipping");
    return;
  }

  const resumeData = resume.parsedData as ResumeData;
  const score = env.DRY_RUN
    ? buildFixtureScore(job.get("requiredSkills"), resumeData.skills)
    : await scoreResumeAgainstJob(job.get("jdText"), resumeData);

  if (!score) {
    logger.error({ applicationId: data.applicationId }, "AI scoring returned no parsed output");
    return;
  }

  const result = await AiScreeningResult.create({
    applicationId: application._id,
    jobId: job._id,
    resumeId: resume._id,
    ...score,
    modelUsed: env.DRY_RUN ? "dry-run-fixture" : env.AI_SCREENING_MODEL,
    promptVersion: "v1",
  });

  application.set("aiScreeningResultId", result._id);
  if (application.get("status") === "applied") {
    application.set("status", "screening");
  }
  await application.save();

  logger.info({ applicationId: data.applicationId, matchScore: score.matchScore }, "Screening complete");
}
