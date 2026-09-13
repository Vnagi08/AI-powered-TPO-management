import * as Sentry from "@sentry/react";

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN_CLIENT;
  if (!dsn) return; // dev/local default — no DSN configured

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    // Never let a stray password/token field reach Sentry — see ARCHITECTURE.md §9.
    beforeSend(event) {
      if (event.request?.data && typeof event.request.data === "object") {
        for (const key of Object.keys(event.request.data)) {
          if (/password|token|secret|authorization/i.test(key)) {
            (event.request.data as Record<string, unknown>)[key] = "[Scrubbed]";
          }
        }
      }
      return event;
    },
  });
}
