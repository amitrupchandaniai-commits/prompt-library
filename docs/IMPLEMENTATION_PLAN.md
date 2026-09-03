# Implementation Plan

Seven phases, per the master spec (§67). Each phase has explicit entry/exit criteria so a future session (or a future you) can tell exactly what's done and what isn't, without re-reading the whole codebase.

## Phase 1 — Foundation ✅ (this build)

**Scope**: Project setup, Supabase Auth, database schema (full column set, only core columns active), prompt CRUD, categories (read-only global taxonomy), tags, collections, favorites, basic keyword search, dashboard with real KPIs, seed data.

**Exit criteria**:
- User can sign up (email/password or magic link), stays signed in across reload
- User can create/edit/archive/delete a prompt with variables, category, tags, notes
- Editing a prompt writes a new `prompt_versions` row; version history is viewable
- User can favorite prompts, create collections, add/remove prompts from a collection
- Keyword search (title/description/prompt_text/tags) with category/tag filters works
- Dashboard shows real counts (not placeholders) for everything Phase 1 tracks
- RLS verified: one user cannot read/write another user's prompts/collections/favorites
- `tsc --noEmit`, `next lint`, `vitest run` all clean
- Deployed to Vercel against the real Supabase project

**Explicitly not built**: AI Builder/Improver/Tester, semantic search, Prompt Scout, Google Sheets/Drive, cost tracking, admin category management, multi-user teams. Nav entries for these exist but are disabled/"Coming soon" — not fake-functional.

## Phase 2 — AI-Assisted Authoring

**Entry**: Phase 1 exit criteria met, AI provider keys (Anthropic/OpenAI) added to env.
**Scope**: `AIProvider` abstraction, Prompt Builder (role/objective/context/... → structured prompt), Prompt Improver (score + rewrite, never overwrites original), full versioning UI (compare/restore), `ai_usage_log` table + logging wired into every call from day one (see `AI_COST_CONTROL.md`).
**Exit**: User can build a prompt from scratch via guided questions, improve any existing prompt with visible before/after + scores, and every AI call is logged with cost.

## Phase 3 — Semantic Search ✅

**Entry**: Phase 2 exit criteria met.
**Scope**: `embedding vector(1536)` column on `prompts`, embedding generation on create/update (and on AI-build/improve/restore), pgvector cosine-similarity search (`match_prompts()`), natural-language search wired into the main Prompt Library search box, category filter still applies.
**Exit**: A natural-language query returns semantically relevant results, not just keyword matches — met, with a graceful fallback to keyword search when `OPENAI_API_KEY` isn't configured or the embedding call fails.

**Not built**: the wider search-filter set (industry/type/model/quality/source/date/verified/AI-discovered) — most of those fields don't have real values yet since Prompt Scout (Phase 4) is what populates them; revisit once that data exists. No ANN index yet (documented in `docs/DATABASE.md`, fine at current scale).

## Phase 4 — Prompt Scout ✅ (pipeline, manual run, and weekly cron all live)

**Entry**: Phase 3 exit criteria met, admin has curated at least a handful of entries in `sources`.
**Scope**: `sources`, `research_runs`, `research_candidates`, `processed_content` tables; Trigger.dev weekly cron + manual "Run Now"; full pipeline from `AGENT_ARCHITECTURE.md`; candidate review queue UI; security/injection defenses live (not just documented).
**Exit**: A real weekly run discovers, scores, and queues candidates; admin can approve/reject/merge from the in-app queue; approved candidates become real `prompts` rows with provenance preserved.

**Built**: the full discover→fetch→dedupe(processed_content)→security-filter→analyze→score→dedupe(pgvector)→classify→queue pipeline, deliberately scope-limited (2 sources × 2 items, `lib/scout/pipeline.ts`'s `DEFAULT_SCOUT_CONFIG` — reduced from an initial 3×5 after a live run got killed mid-flight by Vercel's function time limit) to reliably finish inside one invocation. Runnable two ways: manually from `/prompt-scout` ("Run now", cookie-based session client) and on a schedule via a Trigger.dev `schedules.task` (`trigger/prompt-scout.ts`, Sunday 02:00 UTC by default — configurable via `SCOUT_TIMEZONE`, using a service-role client since headless jobs have no session). `runPromptScout`/`logAiUsage` take an injected Supabase client so the same pipeline code serves both entry points; `match_prompts` takes an explicit `match_user_id` rather than relying on `auth.uid()`, which is null for a service-role client. Review queue (approve/reject, no merge yet) at `/prompt-scout/queue`. Sources CRUD at `/sources`, seeded with 5 verified RSS feeds. Code-level injection pre-filter (`lib/scout/security-filter.ts`) plus a system prompt that treats fetched content as untrusted data — both live, not just documented. Manual review only; nothing auto-publishes.

**Not built**: "merge" action in the review queue, admin-configurable run limits (currently a code constant), fetching non-RSS source types (`api`/`web` sources can be registered but aren't fetched).

## Phase 5 — Google Integration

**Entry**: Phase 4 exit criteria met.
**Scope**: Google OAuth connect flow, Sheets sync (per `GOOGLE_INTEGRATION.md`), Drive report upload, error handling that never fails the parent run, Settings → Google Integration UI.
**Exit**: After a Prompt Scout run, "New Discoveries" sheet reflects candidates, a weekly report PDF lands in Drive, and both failure paths are demonstrated not to break the run.

## Phase 6 — Testing, Cost, Analytics, Recommendations

**Entry**: Phase 5 exit criteria met.
**Scope**: Prompt Tester (multi-model), full cost dashboards, analytics (spec §65), audit log UI, import/export (TXT/CSV/JSON/Markdown/PDF, incl. to Drive), trend detection, personal recommendations (with opt-out).
**Exit**: All of spec §65/§46/§47/§48/§44 implemented and demonstrated.

## Phase 7 — Hardening & Production

**Entry**: Phase 6 exit criteria met.
**Scope**: Security review pass (`/security-review`), performance pass (query plans, caching, pagination audit), Playwright e2e suite covering the golden paths across all phases, full error-handling audit, final production deployment checklist.
**Exit**: Spec §75 "Definition of Done" checklist fully satisfied.

## Cross-Phase Rules (never relaxed)

- No fake buttons — an unbuilt feature is disabled and labeled, never wired to a stub.
- No silent architectural decisions — anything ambiguous gets flagged to the user before being decided.
- Supabase remains the source of truth at every phase; Sheets/Drive never become authoritative.
- Every phase ends with lint + typecheck + tests green before being called done.
