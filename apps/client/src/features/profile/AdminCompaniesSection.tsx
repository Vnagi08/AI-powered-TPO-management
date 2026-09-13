import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Field } from "../../components/Field";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { extractErrorMessage } from "../../lib/errors";
import { createCompany, listCompanies, verifyCompany } from "./profileApi";

export function AdminCompaniesSection() {
  const queryClient = useQueryClient();
  const companiesQuery = useQuery({ queryKey: ["companies"], queryFn: listCompanies });
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createCompany({ name, website: website || undefined });
      setName("");
      setWebsite("");
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleVerified(id: string, current: boolean) {
    await verifyCompany(id, !current);
    await queryClient.invalidateQueries({ queryKey: ["companies"] });
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-900">Companies</h2>
      <ul className="mt-2 space-y-2">
        {companiesQuery.data?.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
          >
            <span className="text-slate-700">
              {c.name} {c.industry ? <span className="text-slate-400">· {c.industry}</span> : ""}
            </span>
            <button onClick={() => toggleVerified(c.id, c.verifiedByAdmin)}>
              <Badge tone={c.verifiedByAdmin ? "success" : "warning"}>
                {c.verifiedByAdmin ? "verified" : "click to verify"}
              </Badge>
            </button>
          </li>
        ))}
        {companiesQuery.data?.length === 0 && (
          <li className="text-sm text-slate-400">No companies yet.</li>
        )}
      </ul>

      <form onSubmit={handleCreate} className="mt-4 flex flex-wrap items-end gap-2">
        <div className="min-w-[140px] flex-1">
          <Field label="Company name" type="text" value={name} onChange={setName} required />
        </div>
        <div className="min-w-[140px] flex-1">
          <Field label="Website (optional)" type="text" value={website} onChange={setWebsite} />
        </div>
        <Button type="submit" variant="secondary" disabled={isSubmitting}>
          Add company
        </Button>
      </form>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
