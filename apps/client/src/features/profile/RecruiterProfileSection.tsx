import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Field } from "../../components/Field";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { extractErrorMessage } from "../../lib/errors";
import { getRecruiterProfile, listCompanies, upsertRecruiterProfile } from "./profileApi";

export function RecruiterProfileSection({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["recruiterProfile", userId],
    queryFn: () => getRecruiterProfile(userId),
  });
  const companiesQuery = useQuery({ queryKey: ["companies"], queryFn: listCompanies });

  const [companyId, setCompanyId] = useState("");
  const [designation, setDesignation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await upsertRecruiterProfile(userId, { companyId, designation: designation || undefined });
      await queryClient.invalidateQueries({ queryKey: ["recruiterProfile", userId] });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (profileQuery.isLoading || companiesQuery.isLoading) {
    return <p className="text-sm text-slate-600">Loading profile…</p>;
  }

  if (!profileQuery.data) {
    const companies = companiesQuery.data ?? [];
    return (
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Join your company</h2>
        {companies.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            No companies exist yet — ask a TPO admin to add yours first.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1">Company</span>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="" disabled>
                  Select a company
                </option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.verifiedByAdmin ? "" : "(unverified)"}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Designation (optional)" type="text" value={designation} onChange={setDesignation} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Join company"}
            </Button>
          </form>
        )}
      </div>
    );
  }

  const company = companiesQuery.data?.find((c) => c.id === profileQuery.data!.companyId);
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-900">Recruiter profile</h2>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span>{company?.name ?? profileQuery.data.companyId}</span>
        {company && (
          <Badge tone={company.verifiedByAdmin ? "success" : "warning"}>
            {company.verifiedByAdmin ? "verified" : "unverified"}
          </Badge>
        )}
        {profileQuery.data.designation && <span>· {profileQuery.data.designation}</span>}
      </div>
    </div>
  );
}
