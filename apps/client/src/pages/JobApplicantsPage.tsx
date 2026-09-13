import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useState } from "react";
import {
  listApplicantsForJob,
  screenJobApplicants,
  updateApplicationStatus,
  type AiScreeningResult,
} from "../features/jobs/jobsApi";
import { extractErrorMessage } from "../lib/errors";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge, type BadgeTone } from "../components/ui/Badge";

const FORWARD_OPTIONS: Record<string, string[]> = {
  applied: ["screening", "rejected"],
  screening: ["shortlisted", "rejected"],
  shortlisted: ["interview", "rejected"],
  interview: ["offered", "rejected"],
  offered: [],
  rejected: [],
  withdrawn: [],
};

const RECOMMENDATION_TONES: Record<string, BadgeTone> = {
  strong_fit: "success",
  possible_fit: "warning",
  not_a_fit: "danger",
};

export default function JobApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [isScreening, setIsScreening] = useState(false);
  const applicantsQuery = useQuery({
    queryKey: ["applicants", id],
    queryFn: () => listApplicantsForJob(id!),
    enabled: !!id,
    // Poll while a screening batch we just triggered is still running.
    refetchInterval: isScreening ? 2000 : false,
  });

  async function handleTransition(applicationId: string, status: string) {
    setError(null);
    try {
      await updateApplicationStatus(applicationId, status);
      await queryClient.invalidateQueries({ queryKey: ["applicants", id] });
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleScreen() {
    setError(null);
    setIsScreening(true);
    try {
      const { enqueued } = await screenJobApplicants(id!);
      if (enqueued === 0) {
        setError("Nothing to screen — every applicant already has a result.");
        setIsScreening(false);
        return;
      }
      // Stop polling after a generous window regardless — DRY_RUN fixtures finish in
      // well under a second, but this also covers a real Gemini call.
      setTimeout(() => setIsScreening(false), 15000);
    } catch (err) {
      setError(extractErrorMessage(err));
      setIsScreening(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Applicants</h1>
        <Button onClick={handleScreen} disabled={isScreening}>
          {isScreening ? "Screening…" : "Screen unscored applicants with AI"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card padded={false} className="divide-y divide-slate-100">
        {applicantsQuery.data?.map((app) => {
          const result: AiScreeningResult | undefined =
            typeof app.aiScreeningResultId === "object" ? app.aiScreeningResultId : undefined;
          return (
            <div key={app.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-slate-900">Applicant {app.studentId}</p>
                  <p className="text-xs text-slate-400">
                    status: {app.status} · applied {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {result && (
                    <Badge tone={RECOMMENDATION_TONES[result.recommendation]}>
                      {result.matchScore} · {result.recommendation.replace("_", " ")}
                    </Badge>
                  )}
                  {(FORWARD_OPTIONS[app.status] ?? []).map((next) => (
                    <Button key={next} size="sm" variant="secondary" onClick={() => handleTransition(app.id, next)}>
                      → {next}
                    </Button>
                  ))}
                </div>
              </div>
              {result && (
                <p className="mt-2 text-xs text-slate-600">
                  {result.reasoning}
                  {result.matchedSkills.length > 0 && <> · matched: {result.matchedSkills.join(", ")}</>}
                  {result.missingSkills.length > 0 && <> · missing: {result.missingSkills.join(", ")}</>}
                </p>
              )}
            </div>
          );
        })}
        {applicantsQuery.data?.length === 0 && (
          <p className="p-4 text-sm text-slate-600">No applicants yet.</p>
        )}
      </Card>
    </div>
  );
}
