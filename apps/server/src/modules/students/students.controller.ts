import type { Request, Response } from "express";
import type { StudentProfileInput } from "@tpo/shared";
import { AppError } from "../../middleware/errorHandler.js";
import * as studentsService from "./students.service.js";

function assertSelfOrAdmin(req: Request): void {
  if (req.user!.role !== "tpo_admin" && req.user!.id !== req.params.id) {
    throw new AppError(403, "You can only access your own student profile");
  }
}

export async function getProfileHandler(req: Request, res: Response): Promise<void> {
  assertSelfOrAdmin(req);
  const profile = await studentsService.getStudentProfile(req.params.id!);
  res.json({ profile });
}

export async function upsertProfileHandler(req: Request, res: Response): Promise<void> {
  assertSelfOrAdmin(req);
  const profile = await studentsService.upsertStudentProfile(
    req.params.id!,
    req.body as StudentProfileInput,
  );
  res.json({ profile });
}

export async function addResumeHandler(req: Request, res: Response): Promise<void> {
  assertSelfOrAdmin(req);
  if (!req.file) {
    throw new AppError(400, 'No resume file uploaded (multipart field name: "resume")');
  }
  const resume = await studentsService.addResume(req.params.id!, req.file);
  res.status(201).json({ resume });
}

export async function listResumesHandler(req: Request, res: Response): Promise<void> {
  assertSelfOrAdmin(req);
  const resumes = await studentsService.listResumes(req.params.id!);
  res.json({ resumes });
}
