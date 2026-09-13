import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";
import { logger } from "./logger.js";

export const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

const cloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  logger.info("Cloudinary configured — resume uploads will be stored there");
} else {
  logger.warn(
    "No Cloudinary credentials set — falling back to local disk storage under ./uploads " +
      "(dev only; see ARCHITECTURE.md §10). Add CLOUDINARY_* env vars to switch, no code changes needed.",
  );
}

/**
 * type: "authenticated" means the raw upload response URL 401s without a
 * signature — resumes contain PII, so they should never be fetchable by
 * anyone who merely has the URL (the previous "raw" type was exactly that).
 * cloudinary.url(..., { sign_url: true }) below produces the one URL shape
 * that can actually fetch it, and only this server (holder of the API
 * secret) can construct that signature.
 */
function uploadToCloudinary(buffer: Buffer, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "raw", type: "authenticated", folder: "resumes", public_id: filename },
      (err, result) => {
        if (err || !result) {
          reject(err ?? new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve(
          cloudinary.url(result.public_id, {
            resource_type: "raw",
            type: "authenticated",
            sign_url: true,
            secure: true,
            version: result.version,
            // Cloudinary's SDK appends a "?_a=..." analytics tracking param by
            // default — harmless for images/video, but it breaks authenticated
            // *raw* file delivery (returns 401 "deny or ACL failure" even with a
            // correct signature). Confirmed empirically: identical URL works with
            // this param stripped, 401s with it present.
            analytics: false,
          }),
        );
      },
    );
    stream.end(buffer);
  });
}

function uploadToLocalDisk(buffer: Buffer, filename: string): string {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  writeFileSync(path.join(UPLOADS_DIR, safeName), buffer);
  return `http://localhost:${env.PORT}/uploads/${safeName}`;
}

/** Returns a publicly-fetchable URL — the ai-worker fetches it by HTTP either way. */
export async function uploadResumeFile(buffer: Buffer, filename: string): Promise<string> {
  return cloudinaryConfigured ? uploadToCloudinary(buffer, filename) : uploadToLocalDisk(buffer, filename);
}
