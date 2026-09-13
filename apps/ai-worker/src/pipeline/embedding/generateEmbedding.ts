import { embedText } from "../../ai/clients/embeddingClient.js";

export async function generateResumeEmbedding(resumeText: string): Promise<number[]> {
  return embedText(resumeText, "RETRIEVAL_DOCUMENT");
}

export async function generateQueryEmbedding(query: string): Promise<number[]> {
  return embedText(query, "RETRIEVAL_QUERY");
}
