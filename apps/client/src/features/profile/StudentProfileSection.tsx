import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Field } from "../../components/Field";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { extractErrorMessage } from "../../lib/errors";
import {
  getStudentProfile,
  listResumes,
  uploadResume,
  upsertStudentProfile,
  type StudentProfilePayload,
} from "./profileApi";

export function StudentProfileSection({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["studentProfile", userId],
    queryFn: () => getStudentProfile(userId),
  });

  const [form, setForm] = useState({ rollNumber: "", department: "", batchYear: "", cgpa: "", skills: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const payload: StudentProfilePayload = {
        rollNumber: form.rollNumber,
        department: form.department,
        batchYear: Number(form.batchYear),
        cgpa: form.cgpa ? Number(form.cgpa) : undefined,
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      await upsertStudentProfile(userId, payload);
      await queryClient.invalidateQueries({ queryKey: ["studentProfile", userId] });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (profileQuery.isLoading) {
    return <p className="text-sm text-slate-600">Loading profile…</p>;
  }

  if (!profileQuery.data) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Complete your student profile</h2>
        <p className="mt-1 text-xs text-slate-600">Required before you can apply to jobs.</p>
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <Field
            label="Roll number"
            type="text"
            value={form.rollNumber}
            onChange={(v) => setForm((f) => ({ ...f, rollNumber: v }))}
            required
          />
          <Field
            label="Department"
            type="text"
            value={form.department}
            onChange={(v) => setForm((f) => ({ ...f, department: v }))}
            required
          />
          <Field
            label="Batch year"
            type="number"
            value={form.batchYear}
            onChange={(v) => setForm((f) => ({ ...f, batchYear: v }))}
            required
          />
          <Field
            label="CGPA (optional)"
            type="number"
            value={form.cgpa}
            onChange={(v) => setForm((f) => ({ ...f, cgpa: v }))}
          />
          <Field
            label="Skills (comma-separated)"
            type="text"
            value={form.skills}
            onChange={(v) => setForm((f) => ({ ...f, skills: v }))}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </div>
    );
  }

  const profile = profileQuery.data;
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-900">Student profile</h2>
      <p className="mt-2 text-sm text-slate-600">
        {profile.department} · Batch {profile.batchYear} · Roll {profile.rollNumber}
        {profile.cgpa !== undefined && <> · CGPA {profile.cgpa}</>}
      </p>
      {profile.skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {profile.skills.map((skill) => (
            <Badge key={skill} tone="indigo">
              {skill}
            </Badge>
          ))}
        </div>
      )}
      <ResumeSection userId={userId} />
    </div>
  );
}

function ResumeSection({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const resumesQuery = useQuery({
    queryKey: ["resumes", userId],
    queryFn: () => listResumes(userId),
    // Poll while the AI worker hasn't finished parsing yet — stops once every
    // resume has a parsedAt, so this doesn't poll forever.
    refetchInterval: (query) => {
      const stillParsing = query.state.data?.some((r) => !r.parsedAt);
      return stillParsing ? 2000 : false;
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await uploadResume(userId, file);
      await queryClient.invalidateQueries({ queryKey: ["resumes", userId] });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <h3 className="text-sm font-semibold text-slate-900">Resumes</h3>
      <ul className="mt-2 space-y-2">
        {resumesQuery.data?.map((r) => (
          <li key={r.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <a
                href={r.fileUrl}
                className="truncate text-sm font-medium text-brand-600 hover:text-brand-700"
                target="_blank"
                rel="noreferrer"
              >
                {r.originalFilename}
              </a>
              {r.parsedAt ? (
                <Badge tone="success">parsed</Badge>
              ) : (
                <Badge tone="warning">parsing…</Badge>
              )}
            </div>
            {r.parsedAt && r.parsedData?.skills.length ? (
              <p className="mt-1 text-xs text-slate-600">{r.parsedData.skills.join(", ")}</p>
            ) : null}
          </li>
        ))}
        {resumesQuery.data?.length === 0 && <li className="text-sm text-slate-400">No resumes yet.</li>}
      </ul>
      <label className="mt-3 inline-block cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
        {isSubmitting ? "Uploading…" : "Upload resume (PDF/DOCX)"}
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          disabled={isSubmitting}
          className="hidden"
        />
      </label>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
