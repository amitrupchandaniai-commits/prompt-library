# Architecture

## 1. Product Summary

Prompt Library is a personal-first (multi-user-ready) knowledge base for AI prompts. Users save, organize, search, improve, test, and reuse prompts. An autonomous weekly agent, **Prompt Scout**, discovers new prompts and prompting techniques from approved public sources and feeds them through a human review queue into the library.

Supabase Postgres is the **single source of truth**. Google Sheets is a secondary, human-friendly operational/review layer for Prompt Scout's discoveries. Google Drive stores generated reports and exports. Neither Google service is ever authoritative for application data.

## 2. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router), TypeScript, React 19 | Server components for data-heavy pages, route handlers double as the API layer, first-class Vercel deploy |
| Styling/UI | Tailwind CSS + shadcn/ui (Radix primitives) | Accessible by default (WCAG requirements in spec §72), fast to build a Notion/Linear-inspired but original UI |
| Database | Supabase Postgres 17 + `pgvector` | Relational integrity, RLS for per-user isolation, `pgvector` for Phase 3 semantic search without a second database |
| Auth | Supabase Auth (email/password, magic link; Google social login added in Phase 5) | Native RLS integration via `auth.uid()`, no separate session store |
| Data access | `@supabase/ssr` + `@supabase/supabase-js`, typed via generated `database.types.ts` | Cookie-based SSR sessions; no ORM — thin query helpers keep SQL/RLS behavior visible and auditable |
| Validation | Zod | Shared schemas between client forms and server route handlers — one source of truth for input rules |
| AI provider layer | Custom `AIProvider` interface (`AnthropicProvider`, `OpenAIProvider`) | Swappable models per spec §42 without touching business logic; every call logged for cost tracking (§43) |
| Background jobs | Trigger.dev | Managed scheduling + retries + observability for the weekly Prompt Scout run, without hand-rolling a queue/worker; see "Scheduler rationale" below |
| Google integration | `googleapis` (Sheets v4, Drive v3) via OAuth2, server-only | Official SDK, minimum scopes, tokens never reach the browser |
| Testing | Vitest (unit), Playwright (e2e, Phase 7) | Vitest is fast for pure-function/validation coverage; Playwright deferred until UI surface stabilizes |
| Deployment | Vercel | Zero-config Next.js hosting; Trigger.dev runs independently of the request/response cycle so long research runs aren't bound by serverless timeouts |

### Scheduler rationale (Trigger.dev vs. Vercel Cron)

Prompt Scout's weekly run fetches many sources, calls an LLM repeatedly, and can legitimately run for minutes — longer than is comfortable inside a single serverless function invocation. Trigger.dev runs jobs on its own infrastructure with built-in retries, step-level checkpointing (needed for idempotency, spec §56), and a dashboard for observing failures — all things Vercel Cron + a route handler would require building by hand. The job is defined behind a small interface (`runWeeklyResearch(config): Promise<RunSummary>`) so the trigger mechanism (Trigger.dev today) can be swapped for Vercel Cron later without touching pipeline logic.

## 3. System Diagram (request flow)

```
Browser ──(HTTPS, cookies)──> Next.js (Vercel)
                                 │
                                 ├─ Server Components / Route Handlers
                                 │     └─ @supabase/ssr client (user JWT) ──> Supabase Postgres (RLS enforced)
                                 │
                                 ├─ AI features (Phase 2+)
                                 │     └─ AIProvider ──> Anthropic / OpenAI API
                                 │
                                 └─ Admin-only server actions (service role, never client-exposed)
                                       └─ Supabase (bypasses RLS deliberately, e.g. audit log writes)

Trigger.dev (independent, Phase 4+)
   └─ Weekly cron ──> Prompt Scout pipeline ──> Supabase (service role)
                                              ├─> Google Sheets API (sync candidates)
                                              └─> Google Drive API (upload weekly report)
```

## 4. Phase Boundaries

See `docs/IMPLEMENTATION_PLAN.md` for the authoritative phase-by-phase entry/exit criteria. Summary: **this build covers Phase 1 only** — auth, prompt CRUD, categories, tags, collections, favorites, keyword search, dashboard. Everything AI-related (Builder, Improver, Tester, semantic search, Prompt Scout, Google integrations, cost tracking) is designed here but not implemented yet, and is visibly marked "Coming soon" in the UI rather than faked.

## 5. Key Architectural Principles (carried from the spec)

1. **Supabase is the source of truth** (§4, §64) — Google Sheets/Drive are downstream, never upstream, of application state.
2. **Untrusted external content** (§25) — anything Prompt Scout reads from the web is data, never instructions; enforced at the pipeline level, documented in `AGENT_ARCHITECTURE.md`.
3. **No fake functionality** (§76) — a nav item or button for an unbuilt feature is disabled and labeled, never wired to a stub that pretends to work.
4. **Server-side authorization always** (§50) — every mutation derives `user_id` from the authenticated session, never from client input.
5. **Idempotent, resumable jobs** (§56) — every research run and candidate gets a stable ID; retries never duplicate rows.
