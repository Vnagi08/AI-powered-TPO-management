import { Router } from "express";
import { updateApplicationStatusSchema } from "@tpo/shared";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getAiResultHandler,
  listMyApplicationsHandler,
  updateApplicationStatusHandler,
} from "./applications.controller.js";

export const applicationsRouter = Router();

applicationsRouter.use(requireAuth);

applicationsRouter.get("/me", requireRole("student"), asyncHandler(listMyApplicationsHandler));
applicationsRouter.patch(
  "/:id/status",
  validateBody(updateApplicationStatusSchema),
  asyncHandler(updateApplicationStatusHandler),
);
applicationsRouter.get("/:id/ai-result", asyncHandler(getAiResultHandler));

// POST /jobs/:id/applications and GET /jobs/:id/applications live in jobs.routes.ts
// (nested under the job resource) but share this module's controller — see ARCHITECTURE.md §8.
