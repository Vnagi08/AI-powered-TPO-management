import { Schema, model } from "mongoose";

const studentProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    fullName: { type: String, required: true },
    rollNumber: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    batchYear: { type: Number, required: true },
    cgpa: { type: Number },
    phone: { type: String },
    skills: [{ type: String }],
    resumeIds: [{ type: Schema.Types.ObjectId, ref: "Resume" }],
    activeResumeId: { type: Schema.Types.ObjectId, ref: "Resume" },
    placementStatus: {
      type: String,
      enum: ["unplaced", "placed", "opted_out"],
      default: "unplaced",
    },
  },
  { timestamps: true },
);

export const StudentProfile = model("StudentProfile", studentProfileSchema);
