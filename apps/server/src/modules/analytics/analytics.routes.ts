import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getDepartmentStatsHandler,
  getPlacementsHandler,
  getRecruiterFunnelHandler,
} from "./analytics.controller.js";

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

analyticsRouter.get("/placements", requireRole("tpo_admin"), asyncHandler(getPlacementsHandler));
analyticsRouter.get(
  "/recruiters/:id/funnel",
  requireRole("recruiter", "tpo_admin"),
  asyncHandler(getRecruiterFunnelHandler),
);
analyticsRouter.get(
  "/departments/:dept",
  requireRole("tpo_admin"),
  asyncHandler(getDepartmentStatsHandler),
);
