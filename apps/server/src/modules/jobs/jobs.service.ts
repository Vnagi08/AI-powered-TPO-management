import { Job } from "@tpo/db";
import type { CreateJobInput, UpdateJobInput } from "@tpo/shared";
import { AppError } from "../../middleware/errorHandler.js";

export interface JobListFilters {
  status?: string;
  department?: string;
  companyId?: string;
}

export async function createJob(companyId: string, postedBy: string, input: CreateJobInput) {
  return Job.create({ ...input, companyId, postedBy, status: "draft" });
}

export async function listJobs(filters: JobListFilters) {
  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;
  if (filters.companyId) query.companyId = filters.companyId;
  if (filters.department) query.eligibleDepartments = filters.department;
  return Job.find(query).sort({ createdAt: -1 });
}

export async function getJobById(id: string) {
  const job = await Job.findById(id);
  if (!job) {
    throw new AppError(404, "Job not found");
  }
  return job;
}

// `companyId` is null for a tpo_admin, who may manage any job regardless of company.
async function getOwnedJobOr403(id: string, companyId: string | null) {
  const job = await getJobById(id);
  if (companyId !== null && job.get("companyId").toString() !== companyId) {
    throw new AppError(403, "You can only manage jobs posted by your own company");
  }
  return job;
}

export async function updateJob(id: string, companyId: string | null, input: UpdateJobInput) {
  const job = await getOwnedJobOr403(id, companyId);
  job.set(input);
  await job.save();
  return job;
}

export async function publishJob(id: string, companyId: string | null) {
  const job = await getOwnedJobOr403(id, companyId);
  if (job.get("status") !== "draft") {
    throw new AppError(400, `Cannot publish a job with status "${job.get("status")}"`);
  }
  job.set("status", "open");
  await job.save();
  return job;
}
