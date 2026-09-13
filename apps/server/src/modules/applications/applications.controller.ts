import type { Request, Response } from "express";
import type { ApplyToJobInput, UpdateApplicationStatusInput } from "@tpo/shared";
import { getRecruiterCompanyId } from "../recruiters/recruiters.service.js";
import * as applicationsService from "./applications.service.js";

/** null return means "no restriction" (tpo_admin); otherwise the recruiter's own companyId. */
async function resolveCompanyScope(req: Request): Promise<string | null> {
  if (req.user!.role === "tpo_admin") return null;
  return getRecruiterCompanyId(req.user!.id);
}

export async function applyToJobHandler(req: Request, res: Response): Promise<void> {
  const { resumeId } = req.body as ApplyToJobInput;
  const application = await applicationsService.applyToJob(req.params.id!, req.user!.id, resumeId);
  res.status(201).json({ application });
}

export async function listMyApplicationsHandler(req: Request, res: Response): Promise<void> {
  const applications = await applicationsService.listMyApplications(req.user!.id);
  res.json({ applications });
}

export async function listApplicantsForJobHandler(req: Request, res: Response): Promise<void> {
  const companyId = await resolveCompanyScope(req);
  const applications = await applicationsService.listApplicantsForJob(req.params.id!, companyId);
  res.json({ applications });
}

export async function screenJobHandler(req: Request, res: Response): Promise<void> {
  const companyId = await resolveCompanyScope(req);
  const result = await applicationsService.triggerScreeningForJob(req.params.id!, companyId);
  res.status(202).json(result);
}

export async function getAiResultHandler(req: Request, res: Response): Promise<void> {
  const role = req.user!.role as "student" | "recruiter" | "tpo_admin";
  const companyId = role === "recruiter" ? await getRecruiterCompanyId(req.user!.id) : null;
  const result = await applicationsService.getAiResult(req.params.id!, {
    userId: req.user!.id,
    role,
    companyId,
  });
  res.json({ result });
}

export async function updateApplicationStatusHandler(req: Request, res: Response): Promise<void> {
  const { status, note } = req.body as UpdateApplicationStatusInput;
  const role = req.user!.role as "student" | "recruiter" | "tpo_admin";
  const companyId = role === "recruiter" ? await getRecruiterCompanyId(req.user!.id) : null;

  const application = await applicationsService.updateApplicationStatus(
    req.params.id!,
    { userId: req.user!.id, role, companyId },
    status,
    note,
  );
  res.json({ application });
}
