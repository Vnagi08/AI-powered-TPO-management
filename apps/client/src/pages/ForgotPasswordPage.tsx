import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";
import { forgotPasswordRequest } from "../features/auth/authApi";
import { extractErrorMessage } from "../lib/errors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await forgotPasswordRequest(email);
      setMessage(result.message);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Forgot password">
      {message ? (
        <>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
          <p className="mt-3 text-xs text-slate-400">
            Dev environment: find the reset link in the server's console log if no email provider is
            configured.
          </p>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Sending…" : "Send reset link"}
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
