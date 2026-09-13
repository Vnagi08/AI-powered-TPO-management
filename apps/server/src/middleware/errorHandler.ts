import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { logger } from "../config/logger.js";
import { captureException } from "../config/sentry.js";
import { UnsupportedFileTypeError } from "./upload.js";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

// The MongoDB driver's duplicate-key error, not a mongoose-specific type — it's what
// throws from any unique index (StudentProfile.rollNumber, RecruiterProfile.userId,
// etc.) that isn't pre-checked in the service layer.
function isDuplicateKeyError(err: unknown): err is { code: 11000; keyValue?: Record<string, unknown> } {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === 11000;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express requires 4-arity for error middleware
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Multer's fileFilter/size-limit errors otherwise fall through as a bare 500.
  if (err instanceof MulterError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err instanceof UnsupportedFileTypeError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (isDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? "value";
    res.status(409).json({ error: `That ${field} is already in use` });
    return;
  }

  logger.error({ err }, "Unhandled error");
  captureException(err); // only genuinely unexpected (500) errors go to Sentry — routine 4xx AppErrors don't
  res.status(500).json({ error: "Internal server error" });
}
