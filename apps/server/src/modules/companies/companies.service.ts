import { Company } from "@tpo/db";
import type { CreateCompanyInput } from "@tpo/shared";
import { AppError } from "../../middleware/errorHandler.js";

export async function createCompany(input: CreateCompanyInput) {
  const existing = await Company.findOne({ name: input.name });
  if (existing) {
    throw new AppError(409, "A company with this name already exists");
  }
  return Company.create(input);
}

export async function listCompanies() {
  return Company.find().sort({ name: 1 });
}

export async function getCompanyById(id: string) {
  const company = await Company.findById(id);
  if (!company) {
    throw new AppError(404, "Company not found");
  }
  return company;
}

export async function setCompanyVerified(id: string, verifiedByAdmin: boolean) {
  const company = await Company.findByIdAndUpdate(id, { verifiedByAdmin }, { new: true });
  if (!company) {
    throw new AppError(404, "Company not found");
  }
  return company;
}
