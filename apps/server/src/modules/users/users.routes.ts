import { Router } from "express";
import { updateMeSchema } from "@tpo/shared";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getMeHandler, updateMeHandler } from "./users.controller.js";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, asyncHandler(getMeHandler));
usersRouter.patch("/me", requireAuth, validateBody(updateMeSchema), asyncHandler(updateMeHandler));

// TODO(Phase 3 — see ARCHITECTURE.md §8): student/recruiter profile completion routes
