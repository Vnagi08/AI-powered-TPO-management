import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express, type Request, type Response } from "express";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { UPLOADS_DIR } from "./config/storage.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { studentsRouter } from "./modules/students/students.routes.js";
import { recruitersRouter } from "./modules/recruiters/recruiters.routes.js";
import { companiesRouter } from "./modules/companies/companies.routes.js";
import { jobsRouter } from "./modules/jobs/jobs.routes.js";
import { applicationsRouter } from "./modules/applications/applications.routes.js";
import { resumesRouter } from "./modules/resumes/resumes.routes.js";
import { searchRouter } from "./modules/search/search.routes.js";
import { analyticsRouter } from "./modules/analytics/analytics.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(pinoHttp({ logger }));

  // express-rate-limit's default response is plain text, which the client's
  // extractErrorMessage() can't read a clean message out of (it falls back to
  // Axios's generic "Request failed with status code 429") — send JSON instead.
  const rateLimitHandler = (_req: Request, res: Response) => {
    res.status(429).json({ error: "Too many requests — please wait a few minutes and try again." });
  };

  // Both limits are intentionally much higher outside production: they exist to
  // blunt credential stuffing on a real deployment, not to throttle a small team
  // actively testing against one shared local server (curl + a browser both hit
  // the same server from the same machine and share one bucket).
  const isProd = env.NODE_ENV === "production";

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: isProd ? 300 : 5000,
    handler: rateLimitHandler,
  });
  app.use(globalLimiter);

  // Auth endpoints get a tighter, separate limiter to blunt credential stuffing.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: isProd ? 20 : 500,
    handler: rateLimitHandler,
  });

  // Dev-only local-disk fallback for resume files when Cloudinary isn't configured
  // (see config/storage.ts). In production this directory is never written to.
  app.use("/uploads", express.static(UPLOADS_DIR));

  // Unversioned — for Render/uptime-monitor health probes.
  app.use("/health", healthRouter);

  // Versioned — matches VITE_API_BASE_URL on the client (see ARCHITECTURE.md §11).
  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authLimiter, authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/students", studentsRouter);
  app.use("/api/v1/recruiters", recruitersRouter);
  app.use("/api/v1/companies", companiesRouter);
  app.use("/api/v1/jobs", jobsRouter);
  app.use("/api/v1/applications", applicationsRouter);
  app.use("/api/v1/resumes", resumesRouter);
  app.use("/api/v1/search", searchRouter);
  app.use("/api/v1/analytics", analyticsRouter);
  app.use("/api/v1/notifications", notificationsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
