import { Router } from "express";
import { searchResumesSchema } from "@tpo/shared";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { searchResumesHandler } from "./search.controller.js";

export const searchRouter = Router();

searchRouter.use(requireAuth);

searchRouter.post(
  "/resumes",
  requireRole("recruiter", "tpo_admin"),
  validateBody(searchResumesSchema),
  asyncHandler(searchResumesHandler),
);
