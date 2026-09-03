# Prompt Library

A personal "second brain" for AI prompts — save, organize, search, build, and improve prompts, with an autonomous weekly research agent (**Prompt Scout**, Phase 4+) that discovers new prompts and prompting techniques from approved public sources.

**Phases 1–4 are implemented.** See `docs/IMPLEMENTATION_PLAN.md` for the full 7-phase roadmap and exactly what's built vs. designed-but-not-built.

## What's built

- **Auth** — email/password, magic link, Google sign-in (Supabase Auth), password reset
- **Prompt CRUD** — variables (`{{LIKE_THIS}}`), categories, tags, notes, examples, ratings, archive/delete
- **Versioning** — every edit/AI-improve/restore creates a new version; compare any two side-by-side, restore an old one
- **Collections & favorites**
- **Search** — natural-language semantic search (pgvector + OpenAI embeddings) with a category filter, falling back to keyword search if `OPENAI_API_KEY` isn't configured
- **Prompt Builder** — guided form → AI-generated structured prompt (Claude)
- **Prompt Improver** — paste any prompt → scored on 7 dimensions + AI-rewritten version, applicable to a library prompt or standalone
- **AI cost tracking** — every AI call logged with tokens/latency/cost (`ai_usage_log`)
- **Prompt Scout** — autonomous research agent: discover→fetch→dedupe→security-filter→analyze→score→queue pipeline over a curated `sources` registry, runnable manually (`/prompt-scout`) or on a Trigger.dev weekly schedule (`trigger/prompt-scout.ts`, Sunday 02:00 UTC by default), with an in-app review queue (`/prompt-scout/queue`) — manual approve/reject only, nothing auto-publishes
- **Dashboard** with real KPIs

Not yet built: Google Sheets/Drive integration (Phase 5), Prompt Tester/analytics/import-export (Phase 6), production hardening pass (Phase 7). The sidebar shows these as disabled "Coming soon" entries rather than non-functional buttons.

## Architecture

Full design docs, written before any code:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack, system diagram, phase boundaries
- [`docs/DATABASE.md`](docs/DATABASE.md) — full schema (all phases), RLS policy summary
- [`docs/AGENT_ARCHITECTURE.md`](docs/AGENT_ARCHITECTURE.md) — Prompt Scout pipeline design (Phase 4)
- [`docs/GOOGLE_INTEGRATION.md`](docs/GOOGLE_INTEGRATION.md) — Sheets/Drive design (Phase 5)
- [`docs/SECURITY.md`](docs/SECURITY.md) — threat model and mitigations
- [`docs/AI_COST_CONTROL.md`](docs/AI_COST_CONTROL.md) — AI budget/cost tracking design
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — phase-by-phase entry/exit criteria

## Tech stack

Next.js 16 (App Router, TypeScript, Tailwind CSS v4, shadcn/ui on Base UI primitives) · Supabase (Postgres + pgvector + Auth, source of truth) · Anthropic Claude (generation) · OpenAI (embeddings) · Zod · Vitest.

## Prerequisites

- Node.js 20.9+ (built and tested on Node 24)
- A Supabase project (already provisioned for this build — see below)

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values.

| Variable | Required for | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Core | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Core | Supabase dashboard → Project Settings → API (publishable key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Audit log | Supabase dashboard → Project Settings → API (service role — **secret**). Without it, audit-log writes are silently skipped; everything else still works. |
| `NEXT_PUBLIC_SITE_URL` | Magic-link / OAuth redirects | Your local/deployed base URL |
| `ANTHROPIC_API_KEY` | Prompt Builder / Improver | [console.anthropic.com](https://console.anthropic.com/) → Settings → API Keys |
| `ANTHROPIC_WORKSPACE_ID` | Only if your Anthropic key is org/workspace-linked | Anthropic Console → Settings → Workspaces (full ID, table view truncates it) |
| `OPENAI_API_KEY` | Semantic search (embeddings) | [platform.openai.com](https://platform.openai.com/) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in | Google Cloud Console → APIs & Services → Credentials → OAuth client, redirect URI `<supabase-url>/auth/v1/callback`; enable the Google provider in Supabase Auth with these |
| `GOOGLE_REDIRECT_URI` | Reserved for Phase 5 (Sheets/Drive) | — |
| `TRIGGER_SECRET_KEY` / `TRIGGER_PROJECT_ID` | Trigger.dev CLI login/deploy | Trigger.dev dashboard |

`.env.local` is gitignored and must never be committed. `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security — never expose it to client code or commit it.

**Trigger.dev-only variables** (set in the Trigger.dev project dashboard → Environment Variables → Production, not in `.env.local` — the `weekly-prompt-scout` scheduled task runs headless on Trigger.dev's infrastructure, not in this app's own deployment): `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_WORKSPACE_ID`, `OPENAI_API_KEY`, `SCOUT_OWNER_USER_ID` (the single owning user's `auth.users` id — this app is single-tenant), and optionally `SCOUT_TIMEZONE` (IANA zone, defaults to `UTC`; check `https://cloud.trigger.dev/timezones` for the supported list before setting it — `Asia/Kolkata` was rejected by their validator despite being a standard IANA zone).

## Supabase setup

A Supabase project ("Prompt Library", region `ap-south-1`) was created for this build and all migrations in `supabase/migrations/` are already applied to it — `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` already point at it. To set this up from scratch elsewhere:

1. Create a Supabase project.
2. Apply migrations in order (`supabase/migrations/0001_*.sql` through the highest-numbered file) via the SQL editor, the Supabase CLI, or the Supabase MCP tools.
3. Copy the project URL and publishable key into `.env.local`.
4. Add the service role key for audit logging.
5. Enable the Google provider under Authentication → Sign In / Providers if you want Google sign-in.

RLS is enabled on every user-owned table — see `docs/SECURITY.md` and `docs/DATABASE.md` for the policy model.

## Local development

```bash
npm install
npm run dev
```

Visit http://localhost:3000 — you'll be redirected to `/login`.

## Seed data

25+ realistic seed prompts across 9 categories can be loaded into **your own account** after signing up (seed prompts are owned by a real user, not inserted at migration time — see `supabase/seed.sql` for why):

```bash
npm run seed -- you@example.com
```

Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

## Backfilling embeddings

Prompts saved before `OPENAI_API_KEY` was configured (or before Phase 3 shipped) won't have an embedding and are simply excluded from semantic search results until backfilled:

```bash
npm run backfill-embeddings
```

Safe to re-run — it only processes prompts missing an embedding. Requires `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.

## Testing

```bash
npm run test        # Vitest — validation schemas, slug/variable/pricing helpers
npx tsc --noEmit     # type check
npx eslint .         # lint
```

Note: no browser-automation tool was available in the session this was built in, so the UI was verified via `npm run dev` + `curl` plus direct Supabase-client scripts exercising the CRUD/RLS golden path. Real usage since then (by the project owner, in an actual browser) has caught and fixed several UI-only issues that static checks couldn't — most notably that Base UI's `Select` shows the raw value instead of a label unless you pass an `items` lookup (see any `<Select items={...}>` usage in the codebase for the pattern), and a silent form-validation gap on a field with no matching input. Keep an eye out for the same class of issue in new UI work.

## Deployment

Deployed to Vercel (Node runtime). Push to GitHub, `vercel link`, set the environment variables above in the Vercel project (excluding `NEXT_PUBLIC_SITE_URL`, which should be your production URL instead of `localhost`), then `vercel --prod`.
