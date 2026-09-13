import { Router } from "express";
import { studentProfileSchema } from "@tpo/shared";
import { requireAuth } from "../../middleware/auth.js";
import { uploadResume } from "../../middleware/upload.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  addResumeHandler,
  getProfileHandler,
  listResumesHandler,
  upsertProfileHandler,
} from "./students.controller.js";

export const studentsRouter = Router();

studentsRouter.use(requireAuth);

studentsRouter.get("/:id/profile", asyncHandler(getProfileHandler));
studentsRouter.patch(
  "/:id/profile",
  validateBody(studentProfileSchema),
  asyncHandler(upsertProfileHandler),
);

// Real multipart upload (Phase 4) — replaces the Phase 3 link-paste stand-in.
// See ARCHITECTURE.md §7.2/§13.
studentsRouter.post("/:id/resumes", uploadResume.single("resume"), asyncHandler(addResumeHandler));
studentsRouter.get("/:id/resumes", asyncHandler(listResumesHandler));
