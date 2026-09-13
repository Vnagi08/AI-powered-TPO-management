import { Router } from "express";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "@tpo/shared";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  forgotPasswordHandler,
  loginHandler,
  logoutHandler,
  refreshHandler,
  registerHandler,
  resetPasswordHandler,
  verifyEmailHandler,
} from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), asyncHandler(registerHandler));
authRouter.post("/verify-email", validateBody(verifyEmailSchema), asyncHandler(verifyEmailHandler));
authRouter.post("/login", validateBody(loginSchema), asyncHandler(loginHandler));
authRouter.post("/refresh", asyncHandler(refreshHandler));
authRouter.post("/logout", asyncHandler(logoutHandler));
authRouter.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  asyncHandler(forgotPasswordHandler),
);
authRouter.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  asyncHandler(resetPasswordHandler),
);
