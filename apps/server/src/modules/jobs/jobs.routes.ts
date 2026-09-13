import { Router } from "express";
import { applyToJobSchema, createJobSchema, updateJobSchema } from "@tpo/shared";
import {
  applyToJobHandler,
  listApplicantsForJobHandler,
  screenJobHandler,
} from "../applications/applications.controller.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createJobHandler,
  getJobHandler,
  listJobsHandler,
  publishJobHandler,
  updateJobHandler,
} from "./jobs.controller.js";

export const jobsRouter = Router();

jobsRouter.use(requireAuth);

jobsRouter.post("/", requireRole("recruiter"), validateBody(createJobSchema), asyncHandler(createJobHandler));
jobsRouter.get("/", asyncHandler(listJobsHandler));
jobsRouter.get("/:id", asyncHandler(getJobHandler));
jobsRouter.patch(
  "/:id",
  requireRole("recruiter", "tpo_admin"),
  validateBody(updateJobSchema),
  asyncHandler(updateJobHandler),
);
jobsRouter.post("/:id/publish", requireRole("recruiter", "tpo_admin"), asyncHandler(publishJobHandler));

jobsRouter.post(
  "/:id/applications",
  requireRole("student"),
  validateBody(applyToJobSchema),
  asyncHandler(applyToJobHandler),
);
jobsRouter.get(
  "/:id/applications",
  requireRole("recruiter", "tpo_admin"),
  asyncHandler(listApplicantsForJobHandler),
);
jobsRouter.post("/:id/screen", requireRole("recruiter", "tpo_admin"), asyncHandler(screenJobHandler));
