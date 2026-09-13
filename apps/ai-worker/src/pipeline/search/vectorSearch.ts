import { mongoose } from "@tpo/db";

/**
 * Builds a $vectorSearch aggregation stage against the `resumes.embedding` index.
 * Requires a MongoDB Atlas cluster (M10+) with a Vector Search index configured —
 * this will not work against the local docker-compose MongoDB. See ARCHITECTURE.md §5, §7.5.
 *
 * TODO(Phase 6): wire this up once the Atlas Vector Search index exists.
 */
export function buildResumeVectorSearchStage(queryEmbedding: number[], limit = 20) {
  return {
    $vectorSearch: {
      index: "resume_embedding_index",
      path: "embedding",
      queryVector: queryEmbedding,
      numCandidates: limit * 10,
      limit,
    },
  };
}

export function getResumeCollection() {
  return mongoose.connection.collection("resumes");
}
