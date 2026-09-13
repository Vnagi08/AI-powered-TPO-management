import { ScoreSchema, type ResumeData, type ResumeScore } from "@tpo/shared";
import { gemini } from "../../ai/clients/geminiClient.js";
import { SCORING_RUBRIC_PROMPT } from "../../ai/prompts/scoring-rubric.v1.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

const RESPONSE_SHAPE_INSTRUCTIONS = `Respond with ONLY a JSON object (no markdown, no commentary) matching exactly this shape:
{
  "matchScore": number (0-100),
  "matchedSkills": string[],
  "missingSkills": string[],
  "reasoning": string (max 500 characters),
  "recommendation": "strong_fit" | "possible_fit" | "not_a_fit"
}`;

export async function scoreResumeAgainstJob(
  jdText: string,
  resumeParsed: ResumeData,
): Promise<ResumeScore | null> {
  const response = await gemini.models.generateContent({
    model: env.AI_SCREENING_MODEL,
    contents: `Job Description:\n${jdText}\n\nCandidate Resume Data:\n${JSON.stringify(resumeParsed)}`,
    config: {
      systemInstruction: `${SCORING_RUBRIC_PROMPT}\n\n${RESPONSE_SHAPE_INSTRUCTIONS}`,
      responseMimeType: "application/json",
    },
  });

  let raw: unknown;
  try {
    raw = JSON.parse(response.text ?? "");
  } catch (err) {
    logger.error({ err, text: response.text }, "Gemini scoring response was not valid JSON");
    return null;
  }

  const result = ScoreSchema.safeParse(raw);
  if (!result.success) {
    logger.error({ issues: result.error.issues }, "Gemini scoring response failed schema validation");
    return null;
  }
  return result.data;
}
