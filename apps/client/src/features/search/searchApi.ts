import { apiClient } from "../../lib/apiClient";

export interface ResumeSearchHit {
  resumeId: string;
  studentId: string;
  originalFilename: string;
  skills: string[];
  score: number;
  student?: { fullName: string; department: string; batchYear: number } | null;
}

export async function searchResumes(query: string, limit = 10): Promise<ResumeSearchHit[]> {
  const { data } = await apiClient.post("/search/resumes", { query, limit });
  return data.results;
}
