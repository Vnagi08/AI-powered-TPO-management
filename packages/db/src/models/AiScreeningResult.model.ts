import { Schema, model } from "mongoose";

const aiScreeningResultSchema = new Schema(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: "Application", required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    resumeId: { type: Schema.Types.ObjectId, ref: "Resume", required: true },
    matchScore: { type: Number, required: true, min: 0, max: 100 },
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    reasoning: { type: String, required: true },
    recommendation: {
      type: String,
      enum: ["strong_fit", "possible_fit", "not_a_fit"],
      required: true,
    },
    modelUsed: { type: String, required: true },
    promptVersion: { type: String, required: true },
    tokensUsed: {
      input: Number,
      output: Number,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const AiScreeningResult = model("AiScreeningResult", aiScreeningResultSchema);
