import type { Request, Response } from "express";
import type { CreateCompanyInput, VerifyCompanyInput } from "@tpo/shared";
import * as companiesService from "./companies.service.js";

export async function createCompanyHandler(req: Request, res: Response): Promise<void> {
  const company = await companiesService.createCompany(req.body as CreateCompanyInput);
  res.status(201).json({ company });
}

export async function listCompaniesHandler(_req: Request, res: Response): Promise<void> {
  const companies = await companiesService.listCompanies();
  res.json({ companies });
}

export async function getCompanyHandler(req: Request, res: Response): Promise<void> {
  const company = await companiesService.getCompanyById(req.params.id!);
  res.json({ company });
}

export async function verifyCompanyHandler(req: Request, res: Response): Promise<void> {
  const { verifiedByAdmin } = req.body as VerifyCompanyInput;
  const company = await companiesService.setCompanyVerified(req.params.id!, verifiedByAdmin);
  res.json({ company });
}
