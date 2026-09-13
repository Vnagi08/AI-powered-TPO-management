# Deployment Runbook (Phase 10 — Production Cutover)

This is the checklist for taking this project from local dev to the deployed architecture in [ARCHITECTURE.md §10](ARCHITECTURE.md). Everything in Phases 1–9 is built and verified; this phase is mostly **account creation and configuration that only you can do** (I can't sign up for external services on your behalf). Follow it top to bottom.

## 0. Prerequisite: push to a git repository

This project isn't a git repo yet — Vercel and Render both deploy from a connected GitHub/GitLab/Bitbucket repo, so this has to happen first.

```bash
git init
git add .
git commit -m "Initial commit"
```

Then create a repo on GitHub (or your host of choice) and push. (Ask me to do this step if you'd rather I run it — I didn't do it unprompted since committing is something you should explicitly ask for.)

## 1. MongoDB Atlas

1. Create a free account at mongodb.com/cloud/atlas, create a project, create a cluster — the **free M0 tier is enough**: contrary to older Atlas documentation (and an earlier version of this doc), M0 now supports Atlas Vector Search (up to 3 search/vector indexes per cluster) — confirmed working live against this project's own M0 cluster. Upgrade to M10+ later only if you outgrow M0's other limits (512MB storage, shared throughput), not specifically for Vector Search.
2. Database Access → create a database user with a strong password, scoped to read/write on this project only (not an Atlas org admin credential — see ARCHITECTURE.md §9).
3. Network Access → add Render's static outbound IPs if you're on a paid Render plan that provides them; otherwise "Allow access from anywhere" (0.0.0.0/0) as a fallback — acceptable only because the DB user itself has a strong, unique password and the connection string is never committed.
4. Get the connection string (Database → Connect → Drivers) — this is your `MONGODB_URI`. Append `/tpo_management` as the database name if it isn't already in the URI.
5. **Vector Search index** (needed for Phase 6 semantic search to use real `$vectorSearch` instead of the brute-force fallback): Atlas UI → left sidebar → **Search & Vector Search** → **Create Search Index** → pick **Vector Search** as the index type (not "Atlas Search" — easy to pick wrong, and the two aren't interchangeable after creation) → **JSON Editor** (not the visual builder) → database `tpo_management`, collection `resumes`:
   ```json
   {
     "fields": [
       { "type": "vector", "path": "embedding", "numDimensions": 3072, "similarity": "cosine" }
     ]
   }
   ```
   Name it exactly `resume_embedding_index` (matches `apps/server/src/modules/search/search.service.ts`). `3072` is `gemini-embedding-2`'s actual output size (verified empirically — Google doesn't fix this in the docs the same way older embedding models did, so if you switch `GEMINI_EMBEDDING_MODEL`, re-check the real vector length before setting this). One gotcha hit while setting this up: Atlas's JSON editor step can default to an unrelated "auto-embed" template (`"type": "autoEmbed"`, a `<field-name>` placeholder, a `voyage-4` model) if you don't explicitly clear it first — and once created that way, it **cannot be edited into a regular vector index**, only deleted and recreated. Double-check the JSON on the Review screen actually says `"type": "vector"` and `"path": "embedding"` before clicking Create.

## 2. Upstash Redis

1. Create a free account at upstash.com (GitHub login works).
2. Console → **Create Database** → any name → type **Regional** (cheaper than Global, and there's no need for multi-region here) → pick a region close to where you'll deploy the Render services.
3. Details tab → copy the **`rediss://...`** connection string (double-s = TLS) — this is your `REDIS_URL`.

## 3. Cloudinary (resume file storage)

1. Create a free account at cloudinary.com — the Dashboard shows Cloud Name, API Key, and API Secret immediately after signup.
2. Resumes upload as `type: "authenticated"` (not the old unauthenticated `"raw"`) — `apps/server/src/config/storage.ts` generates the one signed URL shape (`cloudinary.url(..., { sign_url: true, analytics: false })`) that can actually fetch it, so no one can view a resume from the URL alone without the account's API secret. Verified live: the app's real signed URL returns 200, the same URL with its signature stripped returns 401. One residual tradeoff worth knowing: this signature doesn't time-expire (Cloudinary's time-limited links need the separate token-auth add-on) — it closes "anyone with a leaked/guessed URL can view it," not "a URL handed out once stays valid forever." Good enough for the actual risk here (PII exposure via a public URL), revisit with token-auth if that residual matters for your use case.
3. **Gotcha if you ever touch this code**: Cloudinary's Node SDK appends a `?_a=...` analytics tracking parameter to generated URLs by default. That parameter is harmless for images/video, but it silently breaks authenticated **raw** file delivery — you'll get a `401` with header `X-Cld-Error: deny or ACL failure` even though the signature itself is completely correct (confirmed by cross-checking against Cloudinary's own Admin API `secure_url` for the same resource, which matched byte-for-byte). The fix is the `analytics: false` option already in the code — don't remove it while "cleaning up" the URL options.

## 4. Email — Resend (or the zero-domain Gmail fallback) — and a decision this makes for you

**This isn't optional the way it looks.** Two things in `apps/server/src/modules/auth/auth.service.ts` degrade silently with no email provider configured (a dev convenience — see ARCHITECTURE.md §14): registration auto-verifies every account instead of requiring a real email click, and forgot-password only logs the reset link to the server console — a real user has no way to see it. Both work correctly once *some* email provider is configured; pick one:

**Option A — Resend (recommended if you own a domain).** Create a free account at resend.com, verify a sending domain, create an API key — this is your `RESEND_API_KEY`. Set `EMAIL_FROM` to an address on that verified domain. Note: Resend's shared test domain only delivers to the account owner's own inbox, not to arbitrary recipients — it does not work as a stand-in for a verified domain with real users.

**Option B — Gmail SMTP (§4a, no domain needed).** If you don't have a domain, `apps/server/src/config/email.ts` falls back to sending real email via a Gmail account when `RESEND_API_KEY` is unset and `GMAIL_USER`/`GMAIL_APP_PASSWORD` are set:
1. Enable 2-Step Verification on a Gmail account (required for the next step).
2. Google Account → Security → App Passwords → generate one (this is a separate 16-character credential scoped to this one use, not your real Gmail password).
3. Set `GMAIL_USER` to that Gmail address and `GMAIL_APP_PASSWORD` to the generated code.

Emails send as `"<COLLEGE_NAME>" <your-gmail-address>` — real delivery to any recipient, no DNS/domain step, but lower deliverability than a dedicated provider (occasional spam-folder landing) and Gmail's own sending caps (~500/day on a free account). Good enough for a single college's TPO cell; move to Resend + a real domain if this needs to scale further.

If neither is set, the app still runs — it just silently reverts to auto-verify-on-registration and log-only password resets, which is fine for local dev/demo but not for real users.

## 5. Gemini (Google AI Studio) — extraction, scoring, embeddings

1. Get an API key from aistudio.google.com/apikey — this is your `GEMINI_API_KEY`.
2. It goes on **both** services, for different reasons: `apps/ai-worker` uses it for resume extraction and JD-fit scoring (generation); `apps/server` uses it **only** for embedding search queries synchronously (nothing else — see ARCHITECTURE.md §14 for why the server holds this one AI key while everything generation-related stays worker-only).
3. Leave `AI_SCREENING_MODEL=gemini-3.6-flash` and `GEMINI_EMBEDDING_MODEL=gemini-embedding-2` unless you have a reason to change them.
4. Set `DRY_RUN=false` on `apps/ai-worker` once the key is in place — otherwise it keeps using fixture scoring/extraction regardless of the key being present.

## 6. Branding and the first admin account

This codebase is a **deployable template**: one instance of this repo per college, each with its own database, domain, and branding — not one shared multi-tenant app (see ARCHITECTURE.md §14). Two things every new college's deployment needs to set up:

1. **Branding.** Set `COLLEGE_NAME` on `apps/server` (used in email subject lines) and `VITE_COLLEGE_NAME` / `VITE_COLLEGE_LOGO_URL` on `apps/client` (used everywhere in the UI, via `apps/client/src/components/BrandMark.tsx`) to this college's name and logo. They're independent — nothing enforces they match, but they should.
2. **First `tpo_admin` account.** `tpo_admin` accounts are never self-registered through the public API (see ARCHITECTURE.md §6), so a fresh deployment has no way to log in until one exists. Run, against the deployment's real `MONGODB_URI`:
   ```bash
   npm run seed:admin --workspace=apps/server -- --email admin@your-college.edu --name "TPO Admin"
   ```
   This prints a generated password once (pass `--password "..."` instead to set your own). It refuses to overwrite an existing account unless you also pass `--force`. Run it locally with `MONGODB_URI` pointed at the production Atlas cluster (or via Render's shell once the service is deployed), then log in and change the password from the app if you want something more memorable.

## 7. Sentry (optional but recommended)

1. Create two projects at sentry.io — one Node (server), one React (client).
2. Copy each DSN into `SENTRY_DSN_SERVER` / `SENTRY_DSN_WORKER` (server project's DSN works for both) and `VITE_SENTRY_DSN_CLIENT`.
3. Without this, the app runs fine — Sentry no-ops gracefully when no DSN is set (see `apps/server/src/config/sentry.ts`).

## 8. Deploy the backend (Render)

**Option A — Blueprint (recommended):** push `render.yaml` (already in the repo root) to your git repo, then in the Render dashboard: New → Blueprint → connect the repo. Render reads `render.yaml` and creates both services (`tpo-server` web service, `tpo-ai-worker` background worker) automatically. It'll prompt you for every env var marked `sync: false` — paste in the values from steps 1–7 (the admin account itself still needs the `seed:admin` script from step 6, run once the service is live).

**Option B — manual:** create a Web Service pointing at the repo with build command `npm ci && npm run build --workspace=packages/shared && npm run build --workspace=packages/db && npm run build --workspace=apps/server`, start command `node apps/server/dist/server.js`; and a Background Worker with the equivalent for `apps/ai-worker`. Set env vars per [ARCHITECTURE.md §11](ARCHITECTURE.md).

Once deployed, note the server's public URL (e.g. `https://tpo-server.onrender.com`) — you'll need it for the frontend's `VITE_API_BASE_URL`.

## 9. Deploy the frontend (Vercel)

1. New Project → import the same git repo.
2. **Root Directory:** leave at the repo root (not `apps/client`) — this is a monorepo and Vercel's workspace detection is more reliable building from the root.
3. **Build Command:** `npm run build --workspace=apps/client`
4. **Output Directory:** `apps/client/dist`
5. Environment variables: `VITE_API_BASE_URL=https://<your-render-server-url>/api/v1`, `VITE_SENTRY_DSN_CLIENT` (optional), and the branding vars from step 6 (`VITE_COLLEGE_NAME`, `VITE_COLLEGE_LOGO_URL`) — Vite bakes these in at build time, so they must be set here, not just in a local `.env`.
6. Deploy. Note the resulting Vercel URL.

## 10. Close the loop

Go back to the Render `tpo-server` service and set `CLIENT_ORIGIN` to the Vercel URL from step 8 (needed for CORS — see `apps/server/src/app.ts`). Redeploy the server so the new value takes effect.

## 11. Smoke test in production

Exactly the same checks used throughout local dev, now against the real URLs:

```bash
curl https://<your-render-server-url>/health
curl https://<your-render-server-url>/health/ready   # confirms Atlas + Upstash are reachable
```

Then in the browser: register a real account, verify via the real email you receive if `RESEND_API_KEY` is set (not a server log this time), log in, complete a profile, post/apply to a job, upload a real resume and confirm it parses with real Gemini output (not a DRY_RUN fixture), run a real semantic search, and check the Atlas Vector Search index is actually being hit (Atlas's own query metrics, or watch for the absence of the brute-force fallback's cost at scale). Also confirm the `tpo_admin` account from step 6 can log in and see the analytics dashboard.

## 12. Ongoing

- **GitHub Dependabot alerts:** Settings → Security → enable, to catch new vulnerabilities between CI runs (CI's `npm audit --audit-level=critical` only runs on push/PR).
- **Monitoring:** Render and Vercel both have basic uptime/log dashboards built in; Sentry (if configured) catches application errors. UptimeRobot or similar for external uptime pings is the next step if you want alerting beyond that.
