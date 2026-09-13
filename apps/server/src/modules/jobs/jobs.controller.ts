import type { Request, Response } from "express";
import type { CreateJobInput, UpdateJobInput } from "@tpo/shared";
import { getRecruiterCompanyId } from "../recruiters/recruiters.service.js";
import * as jobsService from "./jobs.service.js";

/** null return means "no restriction" (tpo_admin); otherwise the recruiter's own companyId. */
async function resolveCompanyScope(req: Request): Promise<string | null> {
  if (req.user!.role === "tpo_admin") return null;
  return getRecruiterCompanyId(req.user!.id);
}

export async function createJobHandler(req: Request, res: Response): Promise<void> {
  const companyId = await getRecruiterCompanyId(req.user!.id);
  const job = await jobsService.createJob(companyId, req.user!.id, req.body as CreateJobInput);
  res.status(201).json({ job });
}

export async function listJobsHandler(req: Request, res: Response): Promise<void> {
  const { status, department, mine } = req.query;
  const filters: jobsService.JobListFilters = {};

  if (typeof department === "string") filters.department = department;

  if (mine === "true" && req.user!.role !== "student") {
    filters.companyId = await getRecruiterCompanyId(req.user!.id);
    if (typeof status === "string") filters.status = status;
  } else {
    // Students (and anyone browsing without ?mine=true) only ever see published jobs.
    filters.status = "open";
  }

  const jobs = await jobsService.listJobs(filters);
  res.json({ jobs });
}

export async function getJobHandler(req: Request, res: Response): Promise<void> {
  const job = await jobsService.getJobById(req.params.id!);
  res.json({ job });
}

export async function updateJobHandler(req: Request, res: Response): Promise<void> {
  const companyId = await resolveCompanyScope(req);
  const job = await jobsService.updateJob(req.params.id!, companyId, req.body as UpdateJobInput);
  res.json({ job });
}

export async function publishJobHandler(req: Request, res: Response): Promise<void> {
  const companyId = await resolveCompanyScope(req);
  const job = await jobsService.publishJob(req.params.id!, companyId);
  res.json({ job });
}
