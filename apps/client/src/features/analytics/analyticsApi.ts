import { apiClient } from "../../lib/apiClient";

export interface PlacementStats {
  totalStudents: number;
  placedStudents: number;
  placementPercentage: number;
  totalApplications: number;
  byDepartment: { department: string; total: number; placed: number; placementPercentage: number }[];
}

export interface FunnelStage {
  stage: string;
  count: number;
}

export async function getPlacementStats(): Promise<PlacementStats> {
  const { data } = await apiClient.get("/analytics/placements");
  return data;
}

export async function getRecruiterFunnel(recruiterId: string): Promise<FunnelStage[]> {
  const { data } = await apiClient.get(`/analytics/recruiters/${recruiterId}/funnel`);
  return data.funnel;
}
