import type { Request, Response } from "express";
import { AppError } from "../../middleware/errorHandler.js";
import * as analyticsService from "./analytics.service.js";

export async function getPlacementsHandler(_req: Request, res: Response): Promise<void> {
  res.json(await analyticsService.getPlacementStats());
}

export async function getRecruiterFunnelHandler(req: Request, res: Response): Promise<void> {
  if (req.user!.role !== "tpo_admin" && req.user!.id !== req.params.id) {
    throw new AppError(403, "You can only view your own recruiter funnel");
  }
  const funnel = await analyticsService.getRecruiterFunnel(req.params.id!);
  res.json({ funnel });
}

export async function getDepartmentStatsHandler(req: Request, res: Response): Promise<void> {
  const stats = await analyticsService.getDepartmentStats(req.params.dept!);
  res.json(stats);
}
