import type { Request, Response } from "express";
import type { RecruiterProfileInput } from "@tpo/shared";
import { AppError } from "../../middleware/errorHandler.js";
import * as recruitersService from "./recruiters.service.js";

function assertSelfOrAdmin(req: Request): void {
  if (req.user!.role !== "tpo_admin" && req.user!.id !== req.params.id) {
    throw new AppError(403, "You can only access your own recruiter profile");
  }
}

export async function getProfileHandler(req: Request, res: Response): Promise<void> {
  assertSelfOrAdmin(req);
  const profile = await recruitersService.getRecruiterProfile(req.params.id!);
  res.json({ profile });
}

export async function upsertProfileHandler(req: Request, res: Response): Promise<void> {
  assertSelfOrAdmin(req);
  const profile = await recruitersService.upsertRecruiterProfile(
    req.params.id!,
    req.body as RecruiterProfileInput,
  );
  res.json({ profile });
}
