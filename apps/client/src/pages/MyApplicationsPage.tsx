import { useQuery } from "@tanstack/react-query";
import { listMyApplications } from "../features/jobs/jobsApi";
import { Card } from "../components/ui/Card";
import { Badge, type BadgeTone } from "../components/ui/Badge";

const STATUS_TONES: Record<string, BadgeTone> = {
  applied: "neutral",
  screening: "info",
  shortlisted: "indigo",
  interview: "indigo",
  offered: "success",
  rejected: "danger",
  withdrawn: "neutral",
};

export default function MyApplicationsPage() {
  const applicationsQuery = useQuery({ queryKey: ["applications", "me"], queryFn: listMyApplications });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">My applications</h1>

      {applicationsQuery.data?.length === 0 && (
        <p className="text-sm text-slate-600">You haven't applied to anything yet.</p>
      )}

      <Card padded={false} className="divide-y divide-slate-100">
        {applicationsQuery.data?.map((app) => (
          <div key={app.id} className="flex items-center justify-between p-4">
            <span className="text-sm text-slate-600">
              {typeof app.jobId === "string" ? "Job" : app.jobId.title} · applied{" "}
              {new Date(app.createdAt).toLocaleDateString()}
            </span>
            <Badge tone={STATUS_TONES[app.status] ?? "neutral"}>{app.status}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}
