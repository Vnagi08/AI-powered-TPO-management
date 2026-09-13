import { Schema, model } from "mongoose";

const APPLICATION_STATUSES = [
  "applied",
  "screening",
  "shortlisted",
  "interview",
  "offered",
  "rejected",
  "withdrawn",
] as const;

const applicationSchema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    resumeId: { type: Schema.Types.ObjectId, ref: "Resume", required: true },
    status: { type: String, enum: APPLICATION_STATUSES, default: "applied" },
    aiScreeningResultId: { type: Schema.Types.ObjectId, ref: "AiScreeningResult" },
  },
  { timestamps: true },
);

// One application per student per job — enforced at the DB level, not just in the service layer.
applicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });

export const Application = model("Application", applicationSchema);
