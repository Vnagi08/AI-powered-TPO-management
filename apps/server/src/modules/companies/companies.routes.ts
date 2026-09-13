import { Router } from "express";
import { createCompanySchema, verifyCompanySchema } from "@tpo/shared";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createCompanyHandler,
  getCompanyHandler,
  listCompaniesHandler,
  verifyCompanyHandler,
} from "./companies.controller.js";

export const companiesRouter = Router();

companiesRouter.use(requireAuth);

companiesRouter.post(
  "/",
  requireRole("tpo_admin"),
  validateBody(createCompanySchema),
  asyncHandler(createCompanyHandler),
);
companiesRouter.get("/", asyncHandler(listCompaniesHandler));
companiesRouter.get("/:id", asyncHandler(getCompanyHandler));
companiesRouter.patch(
  "/:id/verify",
  requireRole("tpo_admin"),
  validateBody(verifyCompanySchema),
  asyncHandler(verifyCompanyHandler),
);
