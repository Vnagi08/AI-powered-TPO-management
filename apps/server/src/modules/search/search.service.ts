import { Resume, StudentProfile } from "@tpo/db";
import { embedQuery } from "../../ai/geminiClient.js";
import { logger } from "../../config/logger.js";

export interface ResumeSearchHit {
  resumeId: string;
  studentId: string;
  originalFilename: string;
  skills: string[];
  score: number;
  student?: { fullName: string; department: string; batchYear: number } | null;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

async function attachStudentInfo(
  hits: Omit<ResumeSearchHit, "student">[],
): Promise<ResumeSearchHit[]> {
  const studentIds = [...new Set(hits.map((h) => h.studentId))];
  const profiles = await StudentProfile.find({ _id: { $in: studentIds } });
  const byId = new Map(profiles.map((p) => [p._id.toString(), p]));

  return hits.map((hit) => {
    const profile = byId.get(hit.studentId);
    return {
      ...hit,
      student: profile
        ? {
            fullName: profile.get("fullName"),
            department: profile.get("department"),
            batchYear: profile.get("batchYear"),
          }
        : null,
    };
  });
}

/**
 * Brute-force cosine similarity over every embedded resume — used whenever
 * $vectorSearch isn't available (local MongoDB / mongodb-memory-server have no
 * such aggregation stage; only Atlas M10+ with a configured vector index does).
 * Fine at this scale (hundreds–low thousands of resumes); Atlas is what makes
 * this scale further. See ARCHITECTURE.md §7.5.
 */
async function bruteForceSearch(queryEmbedding: number[], limit: number): Promise<ResumeSearchHit[]> {
  const resumes = await Resume.find({ embedding: { $exists: true, $ne: [] } }).select("+embedding");

  const scored = resumes
    .map((resume) => ({
      resumeId: resume._id.toString(),
      studentId: resume.get("studentId").toString(),
      originalFilename: resume.get("originalFilename"),
      skills: resume.get("parsedData")?.skills ?? [],
      score: cosineSimilarity(queryEmbedding, resume.get("embedding")),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return attachStudentInfo(scored);
}

async function atlasVectorSearch(queryEmbedding: number[], limit: number): Promise<ResumeSearchHit[]> {
  const results = await Resume.aggregate([
    {
      $vectorSearch: {
        index: "resume_embedding_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: limit * 10,
        limit,
      },
    },
    {
      $project: {
        resumeId: { $toString: "$_id" },
        studentId: { $toString: "$studentId" },
        originalFilename: 1,
        skills: "$parsedData.skills",
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return attachStudentInfo(results as Omit<ResumeSearchHit, "student">[]);
}

export async function searchResumes(query: string, limit = 10): Promise<ResumeSearchHit[]> {
  const queryEmbedding = await embedQuery(query);

  try {
    const atlasResults = await atlasVectorSearch(queryEmbedding, limit);
    // A real Atlas cluster with $vectorSearch support but no "resume_embedding_index"
    // configured yet (see DEPLOYMENT.md §1) doesn't throw — it just returns zero
    // results, since the query engine treats "no matching search index" as "no
    // matches" rather than an error. A thrown error (older MongoDB, no $vectorSearch
    // support at all) falls to the catch below; this covers the silent-empty case.
    if (atlasResults.length > 0) {
      logger.info({ hits: atlasResults.length }, "Semantic search served by Atlas $vectorSearch");
      return atlasResults;
    }
    logger.info("Atlas $vectorSearch returned no results — falling back to brute-force search");
    return await bruteForceSearch(queryEmbedding, limit);
  } catch (err) {
    logger.warn({ err }, "Atlas $vectorSearch threw — falling back to brute-force search");
    return bruteForceSearch(queryEmbedding, limit);
  }
}
