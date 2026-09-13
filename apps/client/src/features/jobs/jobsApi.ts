import { apiClient } from "../../lib/apiClient";

export interface JobRecord {
  id: string;
  title: string;
  description: string;
  jdText: string;
  requiredSkills: string[];
  eligibleDepartments: string[];
  eligibleBatchYears: number[];
  status: "draft" | "open" | "closed";
  applicationDeadline: string;
  companyId: string;
}

export async function listOpenJobs(): Promise<JobRecord[]> {
  const { data } = await apiClient.get("/jobs");
  return data.jobs;
}

export async function listMyCompanyJobs(): Promise<JobRecord[]> {
  const { data } = await apiClient.get("/jobs", { params: { mine: "true" } });
  return data.jobs;
}

export async function getJob(id: string): Promise<JobRecord> {
  const { data } = await apiClient.get(`/jobs/${id}`);
  return data.job;
}

export interface CreateJobPayload {
  title: string;
  description: string;
  jdText: string;
  requiredSkills: string[];
  eligibleDepartments: string[];
  eligibleBatchYears: number[];
  applicationDeadline: string;
}

export async function createJob(input: CreateJobPayload): Promise<JobRecord> {
  const { data } = await apiClient.post("/jobs", input);
  return data.job;
}

export async function publishJob(id: string): Promise<JobRecord> {
  const { data } = await apiClient.post(`/jobs/${id}/publish`);
  return data.job;
}

export async function applyToJob(jobId: string, resumeId: string): Promise<void> {
  await apiClient.post(`/jobs/${jobId}/applications`, { resumeId });
}

export interface AiScreeningResult {
  id: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
  recommendation: "strong_fit" | "possible_fit" | "not_a_fit";
  modelUsed: string;
}

export interface ApplicationRecord {
  id: string;
  // Populated to { id, title } on /applications/me; a plain id string elsewhere
  // (e.g. the recruiter's applicant list, which doesn't need the job's own title).
  jobId: string | { id: string; title: string };
  studentId: string;
  resumeId: string;
  status: string;
  createdAt: string;
  // Populated on the recruiter's applicant list (listApplicantsForJob) once screened.
  aiScreeningResultId?: AiScreeningResult | string;
}

export async function listMyApplications(): Promise<ApplicationRecord[]> {
  const { data } = await apiClient.get("/applications/me");
  return data.applications;
}

export async function listApplicantsForJob(jobId: string): Promise<ApplicationRecord[]> {
  const { data } = await apiClient.get(`/jobs/${jobId}/applications`);
  return data.applications;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string,
  note?: string,
): Promise<ApplicationRecord> {
  const { data } = await apiClient.patch(`/applications/${applicationId}/status`, { status, note });
  return data.application;
}

export async function screenJobApplicants(jobId: string): Promise<{ enqueued: number }> {
  const { data } = await apiClient.post(`/jobs/${jobId}/screen`);
  return data;
}
