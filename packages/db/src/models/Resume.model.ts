import { Schema, model } from "mongoose";

const resumeSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, enum: ["pdf", "docx"], required: true },
    originalFilename: { type: String, required: true },
    parsedText: { type: String },
    parsedData: {
      skills: [{ type: String }],
      education: [
        {
          institution: String,
          degree: String,
          year: Number,
        },
      ],
      experience: [
        {
          company: String,
          role: String,
          durationMonths: Number,
          summary: String,
        },
      ],
      totalExperienceMonths: Number,
    },
    // Excluded by default — this is a large vector, only pull it when actually
    // running a similarity search (see ARCHITECTURE.md §7.5).
    embedding: { type: [Number], select: false },
    embeddingModel: { type: String },
    parsedAt: { type: Date },
  },
  { timestamps: true },
);

export const Resume = model("Resume", resumeSchema);
