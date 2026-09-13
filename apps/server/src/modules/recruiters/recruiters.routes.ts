import { Router } from "express";
import { recruiterProfileSchema } from "@tpo/shared";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getProfileHandler, upsertProfileHandler } from "./recruiters.controller.js";

export const recruitersRouter = Router();

recruitersRouter.use(requireAuth);

recruitersRouter.get("/:id/profile", asyncHandler(getProfileHandler));
recruitersRouter.patch(
  "/:id/profile",
  validateBody(recruiterProfileSchema),
  asyncHandler(upsertProfileHandler),
);
