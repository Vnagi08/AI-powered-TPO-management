import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { apiClient } from "../lib/apiClient";
import { buttonClasses } from "../lib/buttonStyles";
import { BrandMark, COLLEGE_NAME } from "../components/BrandMark";

interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

function useApiHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const { data } = await apiClient.get<HealthResponse>("/health");
      return data;
    },
    retry: false,
  });
}

const FEATURES = [
  { title: "AI resume screening", body: "Every applicant scored against the job description, with reasoning." },
  { title: "Semantic search", body: "Find candidates by what they can do, not just keyword matches." },
  { title: "Placement analytics", body: "Live placement rate, department breakdowns, and recruiter funnels." },
];

export default function LandingPage() {
  const { data, isLoading, isError } = useApiHealth();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="mx-auto mb-6">
          <BrandMark size="lg" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {COLLEGE_NAME}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-slate-600">
          A placement platform for students, recruiters, and TPO admins — with AI resume screening,
          semantic search, and live placement analytics.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          {user ? (
            <Link to="/dashboard" className={buttonClasses("primary", "md")}>
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className={buttonClasses("primary", "md")}>
                Log in
              </Link>
              <Link to="/register" className={buttonClasses("secondary", "md")}>
                Register
              </Link>
            </>
          )}
        </div>

        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
          {isLoading && <span>Checking API connection…</span>}
          {isError && <span className="text-red-600">API unreachable</span>}
          {data && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-700">API reachable</span>
            </>
          )}
        </div>

        <div className="mt-16 grid gap-4 text-left sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="text-sm font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
