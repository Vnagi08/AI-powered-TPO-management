import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge, type BadgeTone } from "../components/ui/Badge";
import { createJob, listMyCompanyJobs, publishJob } from "../features/jobs/jobsApi";
import { extractErrorMessage } from "../lib/errors";

const STATUS_TONES: Record<string, BadgeTone> = {
  draft: "neutral",
  open: "success",
  closed: "danger",
};

export default function MyJobsPage() {
  const queryClient = useQueryClient();
  const jobsQuery = useQuery({ queryKey: ["jobs", "mine"], queryFn: listMyCompanyJobs });

  const [form, setForm] = useState({
    title: "",
    description: "",
    jdText: "",
    requiredSkills: "",
    eligibleDepartments: "",
    eligibleBatchYears: "",
    applicationDeadline: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createJob({
        title: form.title,
        description: form.description,
        jdText: form.jdText,
        requiredSkills: splitList(form.requiredSkills),
        eligibleDepartments: splitList(form.eligibleDepartments),
        eligibleBatchYears: splitList(form.eligibleBatchYears).map(Number),
        applicationDeadline: form.applicationDeadline,
      });
      setForm({
        title: "",
        description: "",
        jdText: "",
        requiredSkills: "",
        eligibleDepartments: "",
        eligibleBatchYears: "",
        applicationDeadline: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["jobs", "mine"] });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublish(id: string) {
    await publishJob(id);
    await queryClient.invalidateQueries({ queryKey: ["jobs", "mine"] });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">My jobs</h1>

      <Card padded={false} className="divide-y divide-slate-100">
        {jobsQuery.data?.map((job) => (
          <div key={job.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-slate-900">{job.title}</p>
              <Badge tone={STATUS_TONES[job.status] ?? "neutral"}>{job.status}</Badge>
            </div>
            <div className="flex items-center gap-3">
              {job.status === "draft" && (
                <Button size="sm" variant="secondary" onClick={() => handlePublish(job.id)}>
                  Publish
                </Button>
              )}
              <Link
                to={`/jobs/${job.id}/applicants`}
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Applicants
              </Link>
            </div>
          </div>
        ))}
        {jobsQuery.data?.length === 0 && <p className="p-4 text-sm text-slate-600">No jobs posted yet.</p>}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">Post a new job</h2>
        <form onSubmit={handleCreate} className="mt-3 space-y-3">
          <Field
            label="Title"
            type="text"
            value={form.title}
            onChange={(v) => setForm((f) => ({ ...f, title: v }))}
            required
          />
          <Field
            label="Description"
            type="text"
            value={form.description}
            onChange={(v) => setForm((f) => ({ ...f, description: v }))}
            required
          />
          <Field
            label="Full job description text (used for AI screening)"
            type="text"
            value={form.jdText}
            onChange={(v) => setForm((f) => ({ ...f, jdText: v }))}
            required
          />
          <Field
            label="Required skills (comma-separated)"
            type="text"
            value={form.requiredSkills}
            onChange={(v) => setForm((f) => ({ ...f, requiredSkills: v }))}
          />
          <Field
            label="Eligible departments (comma-separated)"
            type="text"
            value={form.eligibleDepartments}
            onChange={(v) => setForm((f) => ({ ...f, eligibleDepartments: v }))}
          />
          <Field
            label="Eligible batch years (comma-separated)"
            type="text"
            value={form.eligibleBatchYears}
            onChange={(v) => setForm((f) => ({ ...f, eligibleBatchYears: v }))}
          />
          <Field
            label="Application deadline"
            type="date"
            value={form.applicationDeadline}
            onChange={(v) => setForm((f) => ({ ...f, applicationDeadline: v }))}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Posting…" : "Post job (draft)"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
