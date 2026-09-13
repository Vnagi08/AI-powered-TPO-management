/**
 * BullMQ queue names + job payload shapes. apps/server (producer) and
 * apps/ai-worker (consumer) both import from here so they can't silently
 * drift on what a job payload looks like.
 */
export const QUEUE_NAMES = {
  PARSE_RESUME: "parse-resume",
  SCREEN_APPLICATION: "screen-application",
} as const;

export interface ParseResumeJobData {
  resumeId: string;
}

export interface ScreenApplicationJobData {
  applicationId: string;
  jobId: string;
  resumeId: string;
}
