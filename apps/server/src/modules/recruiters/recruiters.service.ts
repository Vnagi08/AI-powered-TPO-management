import { Company, RecruiterProfile, User } from "@tpo/db";
import type { RecruiterProfileInput } from "@tpo/shared";
import { AppError } from "../../middleware/errorHandler.js";

export async function getRecruiterProfile(userId: string) {
  const profile = await RecruiterProfile.findOne({ userId });
  if (!profile) {
    throw new AppError(404, "Recruiter profile not yet created — PATCH this endpoint to create it");
  }
  return profile;
}

export async function upsertRecruiterProfile(userId: string, input: RecruiterProfileInput) {
  const [user, company] = await Promise.all([
    User.findById(userId),
    Company.findById(input.companyId),
  ]);
  if (!user) {
    throw new AppError(404, "User not found");
  }
  if (!company) {
    throw new AppError(400, "No such company — ask a TPO admin to add it first");
  }

  return RecruiterProfile.findOneAndUpdate(
    { userId },
    { $set: { companyId: input.companyId, designation: input.designation }, $setOnInsert: { userId } },
    { new: true, upsert: true },
  );
}

/** Used by the jobs module to enforce that a recruiter can only act on their own company's jobs. */
export async function getRecruiterCompanyId(userId: string): Promise<string> {
  const profile = await RecruiterProfile.findOne({ userId });
  if (!profile) {
    throw new AppError(403, "Complete your recruiter profile first");
  }
  return profile.get("companyId").toString();
}
