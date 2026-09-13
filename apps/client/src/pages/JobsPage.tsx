import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getStudentProfile, listResumes } from "../features/profile/profileApi";
import { applyToJob, listOpenJobs, type JobRecord } from "../features/jobs/jobsApi";
import { useAuth } from "../features/auth/AuthContext";
import { extractErrorMessage } from "../lib/errors";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

export default function JobsPage() {
  const { user } = useAuth();
  const jobsQuery = useQuery({ queryKey: ["jobs", "open"], queryFn: listOpenJobs });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Open jobs</h1>

      {jobsQuery.data?.length === 0 && (
        <p className="text-sm text-slate-600">No open jobs right now — check back later.</p>
      )}

      {jobsQuery.data?.map((job) => (
        <JobCard key={job.id} job={job} userId={user?.id} />
      ))}
    </div>
  );
}

function JobCard({ job, userId }: { job: JobRecord; userId?: string }) {
  const queryClient = useQueryClient();
  const resumesQuery = useQuery({
    queryKey: ["resumes", userId],
    queryFn: () => listResumes(userId!),
    enabled: !!userId,
  });
  const profileQuery = useQuery({
    queryKey: ["studentProfile", userId],
    queryFn: () => getStudentProfile(userId!),
    enabled: !!userId,
  });
  const [resumeId, setResumeId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleApply() {
    setMessage(null);
    setIsSubmitting(true);
    try {
      await applyToJob(job.id, resumeId);
      setMessage("Applied!");
      await queryClient.invalidateQueries({ queryKey: ["applications", "me"] });
    } catch (err) {
      setMessage(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  const resumes = resumesQuery.data ?? [];
  const hasProfile = !!profileQuery.data;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{job.title}</h2>
        <span className="shrink-0 text-xs text-slate-400">
          Due {new Date(job.applicationDeadline).toLocaleDateString()}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">{job.description}</p>
      {job.requiredSkills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.requiredSkills.map((skill) => (
            <Badge key={skill} tone="indigo">
              {skill}
            </Badge>
          ))}
        </div>
      )}

      {userId && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          {!hasProfile && (
            <p className="text-xs text-amber-600">Complete your student profile on the dashboard first.</p>
          )}
          {hasProfile && resumes.length === 0 && (
            <p className="text-xs text-amber-600">Add a resume on the dashboard before applying.</p>
          )}
          {hasProfile && resumes.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="" disabled>
                  Choose a resume
                </option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.originalFilename}
                  </option>
                ))}
              </select>
              <Button size="sm" onClick={handleApply} disabled={!resumeId || isSubmitting}>
                {isSubmitting ? "Applying…" : "Apply"}
              </Button>
            </div>
          )}
          {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}
        </div>
      )}
    </Card>
  );
}
