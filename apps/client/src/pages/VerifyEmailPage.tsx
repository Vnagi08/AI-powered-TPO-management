import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";
import * as authApi from "../features/auth/authApi";
import { extractErrorMessage } from "../lib/errors";

type Status = "idle" | "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function verify(tokenToVerify: string) {
    setStatus("loading");
    try {
      const result = await authApi.verifyEmailRequest(tokenToVerify);
      setMessage(result.message);
      setStatus("success");
    } catch (err) {
      setMessage(extractErrorMessage(err));
      setStatus("error");
    }
  }

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      void verify(tokenFromUrl);
    }
    // Only run once on mount, off the URL's initial token — not on every searchParams change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "success") {
    return (
      <AuthLayout title="Email verified">
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <Link to="/login" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
          Go to login
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verify your email">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void verify(token);
        }}
        className="mt-4 space-y-4"
      >
        <Field label="Verification token" type="text" value={token} onChange={setToken} required />
        {status === "error" && <p className="text-sm text-red-600">{message}</p>}
        <Button type="submit" disabled={status === "loading"} className="w-full">
          {status === "loading" ? "Verifying…" : "Verify"}
        </Button>
      </form>
    </AuthLayout>
  );
}
