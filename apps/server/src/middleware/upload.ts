import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
]);

const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5MB — see ARCHITECTURE.md §9 security checklist

export class UnsupportedFileTypeError extends Error {
  constructor() {
    super("Only PDF and DOCX resumes are accepted");
  }
}

function fileFilter(_req: Request, file: Express.Multer.File, callback: FileFilterCallback): void {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    callback(null, true);
    return;
  }
  callback(new UnsupportedFileTypeError());
}

// memoryStorage: the buffer is handed straight to uploadResumeFile() (Cloudinary or
// local disk) — never written to a temp file on the server itself.
export const uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_BYTES },
  fileFilter,
});
