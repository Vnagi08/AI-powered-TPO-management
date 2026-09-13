# AI-Powered TPO Management System

Full-stack placement platform (students / recruiters / TPO admins) with AI-powered resume screening, semantic search, and placement analytics.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system design, data model, AI pipeline, and deployment architecture, and [DEPLOYMENT.md](./DEPLOYMENT.md) for the actual step-by-step production cutover. This README is just "how do I run it locally."

## Structure

```
apps/
├── client/      React + Vite frontend
├── server/      Express REST API (auth, CRUD, orchestration — no AI/ML code)
└── ai-worker/   AI pipeline as its own service (resume parsing, extraction, embedding, scoring)
packages/
├── shared/      Zod schemas + queue payload contracts, used by server + ai-worker
└── db/          Mongoose models, shared by server + ai-worker
```

## Prerequisites

- Node.js 20+
- Docker (for local MongoDB + Redis) — or point at your own MongoDB/Redis instances
- A Gemini API key (only needed to run `ai-worker` for real; see `DRY_RUN` below) — get one free at aistudio.google.com/apikey

## First-time setup

```bash
# 1. Install all workspace dependencies
npm install

# 2. Start local MongoDB + Redis
docker compose up -d

# 3. Copy env files and fill in secrets
cp apps/client/.env.example apps/client/.env
cp apps/server/.env.example apps/server/.env
cp apps/ai-worker/.env.example apps/ai-worker/.env
```

> **Note on local MongoDB:** the `docker-compose.yml` runs plain community MongoDB, which does **not** support Atlas Vector Search (`$vectorSearch`). Semantic resume search only works against a real MongoDB Atlas cluster (M10+) with a vector index configured — see ARCHITECTURE.md §5/§7.5. Everything else works fine locally.

## Running in development

```bash
# All three apps together (client :5173, server :5000, worker has no port)
npm run dev

# Or individually
npm run dev:client
npm run dev:server
npm run dev:worker
```

Visit `http://localhost:5173` — the homepage does a live health check against the API to confirm the whole stack (client → server → Mongo/Redis) is wired up correctly.

`GET http://localhost:5000/health` and `/health/ready` (checks DB + Redis connectivity) are available directly on the API for uptime probes.

## Branding and the first admin account

This is a **deployable template**: each college runs its own copy with its own database, domain, and branding (see ARCHITECTURE.md §14) — not one shared app for every college. Two things every deployment sets:

- **Branding:** `COLLEGE_NAME` (`apps/server/.env`) and `VITE_COLLEGE_NAME` / `VITE_COLLEGE_LOGO_URL` (`apps/client/.env`) control the name/logo shown across the UI and in emails.
- **First `tpo_admin` account:** `tpo_admin` accounts are provisioned, never self-registered (ARCHITECTURE.md §6). Create one with:
  ```bash
  npm run seed:admin --workspace=apps/server -- --email admin@your-college.edu --name "TPO Admin"
  ```
  Prints a generated password once, unless you pass `--password`. See [DEPLOYMENT.md §6](./DEPLOYMENT.md) for the production version of this step.

## Running without real AI API keys

Set `DRY_RUN=true` in `apps/ai-worker/.env` (the default) to make the worker use deterministic fixtures instead of calling Gemini — resume extraction pulls capitalized words as "skills," JD-fit scoring computes a real overlap score against those skills, and embeddings are a hashed bag-of-words vector. The whole pipeline (upload → parse → screen → search) works end-to-end this way, just not with real model output. Flip to `DRY_RUN=false` and add a real `GEMINI_API_KEY` once you have one — no other code changes needed.

Note: `apps/server` also holds `GEMINI_API_KEY` (embedding-only, for semantic search queries) — see ARCHITECTURE.md §14 for why the split works this way, unlike the fully-worker-only key it would be with a generation-only provider.

## Building for production

```bash
npm run build
```

Builds `packages/shared` and `packages/db` first (both apps depend on their compiled output), then `apps/server`, `apps/ai-worker`, and `apps/client` in order. Each app's `package.json` has its own `start` script for its deployed environment — see ARCHITECTURE.md §10 for the Vercel/Render/Atlas deployment layout.

## Type-checking / CI

```bash
npm run typecheck   # all workspaces
npm run build       # full production build, same as CI
```

`.github/workflows/ci.yml` runs both on every PR.
