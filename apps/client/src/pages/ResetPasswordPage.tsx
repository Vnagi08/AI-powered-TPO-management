import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";
import { resetPasswordRequest } from "../features/auth/authApi";
import { extractErrorMessage } from "../lib/errors";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await resetPasswordRequest(token, newPassword);
      setMessage(result.message);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Reset password">
      {message ? (
        <p className="mt-2 text-sm text-slate-600">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Field label="Reset token" type="text" value={token} onChange={setToken} required />
          <Field
            label="New password"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      )}
      <p className="mt-4 text-sm text-slate-600">
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}
