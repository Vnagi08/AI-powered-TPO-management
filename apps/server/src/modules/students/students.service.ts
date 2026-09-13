import { StudentProfile, Resume, User } from "@tpo/db";
import type { StudentProfileInput } from "@tpo/shared";
import { AppError } from "../../middleware/errorHandler.js";
import { uploadResumeFile } from "../../config/storage.js";
import { parseResumeQueue } from "../../queue/queues.js";

export async function getStudentProfile(userId: string) {
  const profile = await StudentProfile.findOne({ userId });
  if (!profile) {
    throw new AppError(404, "Student profile not yet created — PATCH this endpoint to create it");
  }
  return profile;
}

/** Creates the profile on first call, updates it on every subsequent call. */
export async function upsertStudentProfile(userId: string, input: StudentProfileInput) {
  // fullName lives on User (see ARCHITECTURE.md §14) — only needed here for the
  // insert branch, since $setOnInsert is ignored on an update to an existing doc.
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  return StudentProfile.findOneAndUpdate(
    { userId },
    { $set: input, $setOnInsert: { userId, fullName: user.get("fullName") } },
    { new: true, upsert: true },
  );
}

function inferFileType(filename: string): "pdf" | "docx" {
  return filename.toLowerCase().endsWith(".docx") ? "docx" : "pdf";
}

export async function addResume(userId: string, file: Express.Multer.File) {
  const profile = await StudentProfile.findOne({ userId });
  if (!profile) {
    throw new AppError(400, "Complete your student profile before adding a resume");
  }

  const fileUrl = await uploadResumeFile(file.buffer, file.originalname);

  const resume = await Resume.create({
    studentId: profile._id,
    fileUrl,
    fileType: inferFileType(file.originalname),
    originalFilename: file.originalname,
  });

  profile.get("resumeIds").push(resume._id);
  if (!profile.get("activeResumeId")) {
    profile.set("activeResumeId", resume._id);
  }
  await profile.save();

  // Hands off to apps/ai-worker (see ARCHITECTURE.md §7.2) — text extraction +
  // Claude structured extraction happen there, off the request/response cycle.
  await parseResumeQueue.add("parse-resume", { resumeId: resume._id.toString() });

  return resume;
}

export async function listResumes(userId: string) {
  const profile = await StudentProfile.findOne({ userId });
  if (!profile) {
    throw new AppError(404, "Student profile not found");
  }
  return Resume.find({ studentId: profile._id }).sort({ createdAt: -1 });
}
