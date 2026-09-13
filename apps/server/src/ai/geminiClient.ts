import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

const FIXTURE_EMBEDDING_DIM = 256;

/**
 * Same fixture scheme as apps/ai-worker/src/ai/clients/embeddingClient.ts — kept
 * as a small independent duplicate rather than a shared package, since it's a
 * ~20-line pure function and packages/shared is for types/schemas, not runtime
 * API clients. Used when GEMINI_API_KEY isn't configured, so search results
 * are internally consistent with resumes embedded under the same fixture.
 */
function fixtureEmbedding(text: string): number[] {
  const vector = new Array(FIXTURE_EMBEDDING_DIM).fill(0);
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash * 31 + word.charCodeAt(i)) >>> 0;
    }
    vector[hash % FIXTURE_EMBEDDING_DIM] += 1;
  }
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}

const gemini = env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null;

/**
 * Embeds a search query synchronously, directly from the API server — unlike
 * resume extraction/scoring (async, worker-only, holds GEMINI_API_KEY too, but
 * for generation), search needs a fast synchronous response, so this is the one
 * deliberate exception to "the server never holds AI provider keys" (see
 * ARCHITECTURE.md §4/§14): GEMINI_API_KEY here is embeddings-only usage.
 */
export async function embedQuery(text: string): Promise<number[]> {
  if (!gemini) {
    return fixtureEmbedding(text);
  }

  const response = await gemini.models.embedContent({
    model: env.GEMINI_EMBEDDING_MODEL,
    contents: text,
    config: { taskType: "RETRIEVAL_QUERY" },
  });

  const embedding = response.embeddings?.[0]?.values;
  if (!embedding) {
    throw new Error("Gemini embeddings response had no embedding data");
  }
  return embedding;
}
