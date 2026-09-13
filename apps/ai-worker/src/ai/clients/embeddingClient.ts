import { gemini } from "./geminiClient.js";
import { env } from "../../config/env.js";

const FIXTURE_EMBEDDING_DIM = 256;

/**
 * DRY_RUN stand-in — a deterministic hashed bag-of-words vector, not a real
 * embedding. It's still meaningful for demoing semantic search locally: texts
 * sharing words score higher on cosine similarity than unrelated ones, which is
 * enough to prove the vector-search plumbing without a Gemini API key.
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

/**
 * Thin wrapper over Gemini's embedContent — same client instance as
 * geminiClient.ts (extraction/scoring), so one GEMINI_API_KEY covers both
 * generation and embeddings, unlike the old Claude+Voyage split.
 */
export async function embedText(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT",
): Promise<number[]> {
  if (env.DRY_RUN) {
    return fixtureEmbedding(text);
  }

  const response = await gemini.models.embedContent({
    model: env.GEMINI_EMBEDDING_MODEL,
    contents: text,
    config: { taskType },
  });

  const embedding = response.embeddings?.[0]?.values;
  if (!embedding) {
    throw new Error("Gemini embeddings response had no embedding data");
  }
  return embedding;
}
