import { ResumeDataSchema, type ResumeData } from "@tpo/shared";
import { gemini } from "../../ai/clients/geminiClient.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

const EXTRACTION_SYSTEM_PROMPT = `Extract structured data from this resume. Be conservative — do not invent skills or dates not present in the text.

Respond with ONLY a JSON object (no markdown, no commentary) matching exactly this shape:
{
  "skills": string[],
  "education": [{ "institution": string, "degree": string, "year": number | null }],
  "experience": [{ "company": string, "role": string, "durationMonths": number | null, "summary": string }],
  "totalExperienceMonths": number
}`;

export async function extractResumeData(resumeText: string): Promise<ResumeData | null> {
  const response = await gemini.models.generateContent({
    model: env.AI_SCREENING_MODEL,
    contents: resumeText,
    config: {
      systemInstruction: EXTRACTION_SYSTEM_PROMPT,
      responseMimeType: "application/json",
    },
  });

  let raw: unknown;
  try {
    raw = JSON.parse(response.text ?? "");
  } catch (err) {
    logger.error({ err, text: response.text }, "Gemini extraction response was not valid JSON");
    return null;
  }

  const result = ResumeDataSchema.safeParse(raw);
  if (!result.success) {
    logger.error({ issues: result.error.issues }, "Gemini extraction response failed schema validation");
    return null;
  }
  return result.data;
}
