import { Schema, model } from "mongoose";

const recruiterProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    designation: { type: String },
    isCompanyAdmin: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const RecruiterProfile = model("RecruiterProfile", recruiterProfileSchema);
