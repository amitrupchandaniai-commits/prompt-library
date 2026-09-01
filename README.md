# Prompt Library

A personal "second brain" for AI prompts — save, organize, search, and reuse prompts, with an autonomous weekly research agent (**Prompt Scout**, Phase 4+) that discovers new prompts and prompting techniques from approved public sources.

**This repository currently implements Phase 1 only.** See `docs/IMPLEMENTATION_PLAN.md` for the full 7-phase roadmap and exactly what's built vs. designed-but-not-built.

## Architecture

Full design docs, written before any code:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack, system diagram, phase boundaries
- [`docs/DATABASE.md`](docs/DATABASE.md) — full schema (all phases), RLS policy summary
- [`docs/AGENT_ARCHITECTURE.md`](docs/AGENT_ARCHITECTURE.md) — Prompt Scout pipeline design (Phase 4)
- [`docs/GOOGLE_INTEGRATION.md`](docs/GOOGLE_INTEGRATION.md) — Sheets/Drive design (Phase 5)
- [`docs/SECURITY.md`](docs/SECURITY.md) — threat model and mitigations
- [`docs/AI_COST_CONTROL.md`](docs/AI_COST_CONTROL.md) — AI budget/cost tracking design (Phase 2+)
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — phase-by-phase entry/exit criteria

## Tech stack

Next.js 16 (App Router, TypeScript, Tailwind CSS v4, shadcn/ui on Base UI primitives) · Supabase (Postgres + Auth, source of truth) · Zod · Vitest.

## Prerequisites

- Node.js 20.9+ (this project was built and tested on Node 24)
- A Supabase project (already provisioned for this build — see below)

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values. Phase 1 only needs the Supabase block:

| Variable | Required for | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Phase 1 | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Phase 1 | Supabase dashboard → Project Settings → API (publishable key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Phase 1 (audit log) | Supabase dashboard → Project Settings → API (service role — **secret**). Without it, audit-log writes are silently skipped; everything else still works. |
| `NEXT_PUBLIC_SITE_URL` | Phase 1 (magic-link redirect) | Your local/deployed base URL |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | Phase 2+ | Provider dashboards |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | Phase 5+ | Google Cloud Console → OAuth client |
| `TRIGGER_SECRET_KEY` / `TRIGGER_PROJECT_ID` | Phase 4+ | Trigger.dev dashboard |

`.env.local` is gitignored and must never be committed. `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security — never expose it to client code or commit it.

## Supabase setup

A Supabase project ("Prompt Library", region `ap-south-1`) was created for this build and all six Phase 1 migrations in `supabase/migrations/` are already applied to it — `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` already point at it. To set this up from scratch elsewhere:

1. Create a Supabase project.
2. Apply migrations in order (`supabase/migrations/0001_*.sql` through `0007_*.sql`) via the SQL editor, the Supabase CLI, or the Supabase MCP tools.
3. Copy the project URL and publishable key into `.env.local`.
4. Add the service role key for audit logging.

RLS is enabled on every user-owned table — see `docs/SECURITY.md` and `docs/DATABASE.md` for the policy model.

## Local development

```bash
npm install
npm run dev
```

Visit http://localhost:3000 — you'll be redirected to `/login`. Sign up with email/password or a magic link.

## Seed data

25+ realistic seed prompts across 9 categories (Business, Finance, Marketing, E-commerce, Research, Writing, AI Agents, Data Analysis, Prompt Engineering) can be loaded into **your own account** after signing up (seed prompts are owned by a real user, not inserted at migration time — see `supabase/seed.sql` for why):

```bash
npm run seed -- you@example.com
```

Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

## Testing

```bash
npm run test        # Vitest — validation schemas, slug/variable helpers
npx tsc --noEmit     # type check
npx eslint .         # lint
```

Note: this build environment had no browser-automation tool available, so the UI was verified via `npm run dev` + `curl` (routing/redirects) plus a direct Supabase-client script exercising the full auth → CRUD → RLS golden path (sign up, create/edit/favorite/collect a prompt, and a cross-user RLS check confirming one account cannot read/update/delete another's data). A manual click-through in a real browser is still recommended before considering Phase 1 fully verified.

## Deployment

Deploy-ready for Vercel (Node runtime; no Vercel-specific APIs beyond that). Push to GitHub, import the repo in Vercel, and set the same environment variables from `.env.local` in the Vercel project settings (excluding `NEXT_PUBLIC_SITE_URL`, which should be your production URL instead of `localhost`).

## Prompt Scout, Google Sheets/Drive, AI features

Not implemented yet (Phases 2, 4, 5) — see `docs/IMPLEMENTATION_PLAN.md`. The sidebar shows these as disabled "Coming soon" entries rather than non-functional buttons.
