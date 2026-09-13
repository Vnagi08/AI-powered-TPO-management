import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    // Basic identity, independent of role. Role-specific fields (rollNumber, department,
    // companyId, ...) live on StudentProfile/RecruiterProfile, created during profile
    // completion (Phase 3) rather than at registration.
    fullName: { type: String, required: true, trim: true },
    role: { type: String, enum: ["student", "recruiter", "tpo_admin"], required: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false, index: true },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false, index: true },
    passwordResetExpires: { type: Date, select: false },
    refreshTokenHash: { type: String, select: false },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
  },
  { timestamps: true },
);

export const User = model("User", userSchema);
