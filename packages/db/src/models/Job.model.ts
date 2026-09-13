import { Schema, model } from "mongoose";

const jobSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    jdText: { type: String, required: true },
    requiredSkills: [{ type: String }],
    minCgpa: { type: Number },
    eligibleDepartments: [{ type: String }],
    eligibleBatchYears: [{ type: Number }],
    location: { type: String },
    employmentType: {
      type: String,
      enum: ["full_time", "internship", "contract"],
      default: "full_time",
    },
    salaryRange: {
      min: Number,
      max: Number,
      currency: { type: String, default: "INR" },
    },
    applicationDeadline: { type: Date, required: true },
    status: { type: String, enum: ["draft", "open", "closed"], default: "draft", index: true },
  },
  { timestamps: true },
);

export const Job = model("Job", jobSchema);
