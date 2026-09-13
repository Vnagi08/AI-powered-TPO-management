import { Schema, model } from "mongoose";

const companySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    website: { type: String },
    industry: { type: String },
    verifiedByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Company = model("Company", companySchema);
