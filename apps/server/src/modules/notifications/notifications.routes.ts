import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { listNotificationsHandler, markReadHandler } from "./notifications.controller.js";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get("/", asyncHandler(listNotificationsHandler));
notificationsRouter.patch("/:id/read", asyncHandler(markReadHandler));
