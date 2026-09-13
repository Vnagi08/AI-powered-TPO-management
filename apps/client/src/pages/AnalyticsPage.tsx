import { useQuery } from "@tanstack/react-query";
import { HorizontalBarChart, type BarDatum } from "../components/charts/HorizontalBarChart";
import { StatTile } from "../components/charts/StatTile";
import { Card } from "../components/ui/Card";
import { useAuth } from "../features/auth/AuthContext";
import { getPlacementStats, getRecruiterFunnel } from "../features/analytics/analyticsApi";

// Validated against the dataviz skill's palette validator (node scripts/validate_palette.js
// --ordinal): a hand-picked brand-indigo ramp failed both the light-end-contrast and
// adjacent-ΔL checks, so this keeps the already-validated blue ramp instead — close enough
// to the brand indigo to read as one family, and accessibility compliance wins over an
// exact hex match. Sequential single hue for magnitude; ordinal 5-step ramp for the
// funnel's ordered stages.
const SEQUENTIAL_BLUE = "#2a78d6";
const FUNNEL_RAMP = ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#104281"];

function AdminPlacementDashboard() {
  const statsQuery = useQuery({ queryKey: ["analytics", "placements"], queryFn: getPlacementStats });
  const stats = statsQuery.data;

  const departmentBars: BarDatum[] =
    stats?.byDepartment.map((d) => ({
      label: d.department,
      value: d.placementPercentage,
      displayValue: `${d.placementPercentage}%`,
      color: SEQUENTIAL_BLUE,
    })) ?? [];

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Overall placement rate" value={`${stats?.placementPercentage ?? 0}%`} />
        <StatTile label="Total students" value={stats?.totalStudents ?? 0} />
        <StatTile label="Total applications" value={stats?.totalApplications ?? 0} />
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">Placement % by department</h2>
        {departmentBars.length > 0 ? (
          <div className="mt-4">
            <HorizontalBarChart bars={departmentBars} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">No department data yet.</p>
        )}
      </Card>
    </>
  );
}

function RecruiterFunnelDashboard({ userId }: { userId: string }) {
  const funnelQuery = useQuery({
    queryKey: ["analytics", "funnel", userId],
    queryFn: () => getRecruiterFunnel(userId),
  });

  const bars: BarDatum[] =
    funnelQuery.data?.map((f, i) => ({
      label: f.stage,
      value: f.count,
      displayValue: String(f.count),
      color: FUNNEL_RAMP[i] ?? SEQUENTIAL_BLUE,
    })) ?? [];

  return (
    <Card>
      <h2 className="text-sm font-semibold text-slate-900">Your applicant pipeline</h2>
      {bars.length > 0 ? (
        <div className="mt-4">
          <HorizontalBarChart bars={bars} />
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-600">No applications yet.</p>
      )}
    </Card>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Analytics</h1>
      {user?.role === "tpo_admin" && <AdminPlacementDashboard />}
      {user?.role === "recruiter" && <RecruiterFunnelDashboard userId={user.id} />}
    </div>
  );
}
