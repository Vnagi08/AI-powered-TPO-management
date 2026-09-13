import type { ParseResumeJobData, ResumeData } from "@tpo/shared";
import { Resume } from "@tpo/db";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { fetchFileBuffer, extractTextFromBuffer } from "../../pipeline/parsing/extractText.js";
import { extractResumeData } from "../../pipeline/extraction/extractResumeData.js";
import { generateResumeEmbedding } from "../../pipeline/embedding/generateEmbedding.js";

/**
 * Stands in for the real Gemini extraction when DRY_RUN=true, so the whole
 * upload -> parse -> "parsed" pipeline is demoable without a Gemini API key.
 * Pulls a few capitalized-looking tokens out of the real extracted text so it's
 * not pure static fiction, but it is not a real extraction — see ARCHITECTURE.md §14.
 */
function buildFixtureResumeData(text: string): ResumeData {
  const words = text.match(/\b[A-Z][a-zA-Z0-9+.#]{2,}\b/g) ?? [];
  const skills = [...new Set(words)].slice(0, 8);
  return {
    skills: skills.length > 0 ? skills : ["(DRY_RUN fixture — no skills detected)"],
    education: [],
    experience: [],
    totalExperienceMonths: 0,
  };
}

export async function processParseResume(data: ParseResumeJobData): Promise<void> {
  const resume = await Resume.findById(data.resumeId);
  if (!resume) {
    logger.warn({ resumeId: data.resumeId }, "Resume not found, skipping parse job");
    return;
  }

  const fileUrl = resume.get("fileUrl") as string;
  const fileType = resume.get("fileType") as "pdf" | "docx";

  const buffer = await fetchFileBuffer(fileUrl);
  const text = await extractTextFromBuffer(buffer, fileType);

  let parsedData: ResumeData | null;
  if (env.DRY_RUN) {
    parsedData = buildFixtureResumeData(text);
    logger.info(
      { resumeId: data.resumeId },
      "DRY_RUN enabled — using fixture extraction instead of calling Gemini",
    );
  } else {
    parsedData = await extractResumeData(text);
    if (!parsedData) {
      logger.error({ resumeId: data.resumeId }, "Gemini structured extraction returned no parsed output");
      return;
    }
  }

  // Embed the same text used for extraction — see ARCHITECTURE.md §7.5. Under
  // DRY_RUN this is a hashed fixture vector (see embeddingClient.ts), not a real
  // embedding, but it's real enough to demo semantic search locally.
  const embedding = await generateResumeEmbedding(text);

  resume.set("parsedText", text);
  resume.set("parsedData", parsedData);
  resume.set("parsedAt", new Date());
  resume.set("embedding", embedding);
  resume.set("embeddingModel", env.DRY_RUN ? "dry-run-fixture" : env.GEMINI_EMBEDDING_MODEL);
  await resume.save();

  logger.info({ resumeId: data.resumeId, skills: parsedData.skills }, "Resume parsed");
}
