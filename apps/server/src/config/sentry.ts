import * as Sentry from "@sentry/node";
import { env } from "./env.js";
import { logger } from "./logger.js";

export function initSentry(): void {
  if (!env.SENTRY_DSN_SERVER) {
    logger.warn("SENTRY_DSN_SERVER not set — error tracking disabled (dev/local default)");
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN_SERVER,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 0,
    // Never let a stray passwordHash/refreshTokenHash/access-token field reach
    // Sentry — see ARCHITECTURE.md §9 ("beforeSend scrubbing of sensitive fields").
    beforeSend(event) {
      const scrub = (obj: Record<string, unknown> | undefined) => {
        if (!obj) return;
        for (const key of Object.keys(obj)) {
          if (/password|token|secret|authorization/i.test(key)) {
            obj[key] = "[Scrubbed]";
          }
        }
      };
      scrub(event.request?.data as Record<string, unknown> | undefined);
      scrub(event.request?.headers as Record<string, unknown> | undefined);
      return event;
    },
  });
}

export function captureException(err: unknown): void {
  if (env.SENTRY_DSN_SERVER) {
    Sentry.captureException(err);
  }
}
