import { useState, type FormEvent } from "react";
import { searchResumes, type ResumeSearchHit } from "../features/search/searchApi";
import { extractErrorMessage } from "../lib/errors";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResumeSearchHit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSearching(true);
    try {
      setResults(await searchResumes(query));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Semantic resume search</h1>

      <p className="text-xs text-slate-400">
        Runs on real Gemini embeddings. Without an Atlas Vector Search index configured yet, this
        falls back to brute-force cosine similarity instead of `$vectorSearch` — same real
        embeddings either way, just less scalable. See ARCHITECTURE.md §7.5.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. backend engineer with cloud experience"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
        <Button type="submit" disabled={isSearching || !query}>
          {isSearching ? "Searching…" : "Search"}
        </Button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {results && (
        <Card padded={false} className="divide-y divide-slate-100">
          {results.map((hit) => (
            <div key={hit.resumeId} className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">
                  {hit.student?.fullName ?? "Unknown student"}
                </p>
                <span className="text-xs text-slate-600">similarity: {hit.score.toFixed(3)}</span>
              </div>
              <p className="text-xs text-slate-400">
                {hit.student ? `${hit.student.department} · Batch ${hit.student.batchYear}` : ""} ·{" "}
                {hit.originalFilename}
              </p>
              {hit.skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {hit.skills.map((skill) => (
                    <Badge key={skill} tone="indigo">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
          {results.length === 0 && <p className="p-4 text-sm text-slate-600">No matching resumes found.</p>}
        </Card>
      )}
    </div>
  );
}
