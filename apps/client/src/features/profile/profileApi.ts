import axios from "axios";
import { apiClient } from "../../lib/apiClient";

export interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  verifiedByAdmin: boolean;
}

export interface StudentProfile {
  id: string;
  userId: string;
  rollNumber: string;
  department: string;
  batchYear: number;
  cgpa?: number;
  phone?: string;
  skills: string[];
  resumeIds: string[];
  activeResumeId?: string;
  placementStatus: string;
}

export interface RecruiterProfile {
  id: string;
  userId: string;
  companyId: string;
  designation?: string;
  isCompanyAdmin: boolean;
}

export interface ResumeRecord {
  id: string;
  originalFilename: string;
  fileUrl: string;
  fileType: string;
  parsedAt?: string;
  parsedData?: { skills: string[] };
}

function isNotFound(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 404;
}

export async function getStudentProfile(userId: string): Promise<StudentProfile | null> {
  try {
    const { data } = await apiClient.get(`/students/${userId}/profile`);
    return data.profile;
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

export interface StudentProfilePayload {
  rollNumber: string;
  department: string;
  batchYear: number;
  cgpa?: number;
  skills: string[];
}

export async function upsertStudentProfile(
  userId: string,
  input: StudentProfilePayload,
): Promise<StudentProfile> {
  const { data } = await apiClient.patch(`/students/${userId}/profile`, input);
  return data.profile;
}

export async function getRecruiterProfile(userId: string): Promise<RecruiterProfile | null> {
  try {
    const { data } = await apiClient.get(`/recruiters/${userId}/profile`);
    return data.profile;
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

export async function upsertRecruiterProfile(
  userId: string,
  input: { companyId: string; designation?: string },
): Promise<RecruiterProfile> {
  const { data } = await apiClient.patch(`/recruiters/${userId}/profile`, input);
  return data.profile;
}

export async function listCompanies(): Promise<Company[]> {
  const { data } = await apiClient.get("/companies");
  return data.companies;
}

export async function createCompany(input: {
  name: string;
  website?: string;
  industry?: string;
}): Promise<Company> {
  const { data } = await apiClient.post("/companies", input);
  return data.company;
}

export async function verifyCompany(id: string, verifiedByAdmin: boolean): Promise<Company> {
  const { data } = await apiClient.patch(`/companies/${id}/verify`, { verifiedByAdmin });
  return data.company;
}

export async function listResumes(userId: string): Promise<ResumeRecord[]> {
  const { data } = await apiClient.get(`/students/${userId}/resumes`);
  return data.resumes;
}

export async function uploadResume(userId: string, file: File): Promise<ResumeRecord> {
  const formData = new FormData();
  formData.append("resume", file);
  const { data } = await apiClient.post(`/students/${userId}/resumes`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.resume;
}
