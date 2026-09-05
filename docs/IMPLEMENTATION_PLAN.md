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

## Phase 2 — AI-Assisted Authoring ✅

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

## Phase 5 — Google Integration ✅

**Entry**: Phase 4 exit criteria met.
**Scope**: Google OAuth connect flow, Sheets sync (per `GOOGLE_INTEGRATION.md`), Drive report upload, error handling that never fails the parent run, Settings → Google Integration UI.
**Exit**: After a Prompt Scout run, "New Discoveries" sheet reflects candidates, a weekly report PDF lands in Drive, and both failure paths are demonstrated not to break the run — met, verified end-to-end in both local dev and production (a real run synced to a live spreadsheet and uploaded a report PDF, both `sheets_sync_status`/`drive_report_status` recorded correctly).

**Built**: the full spec — OAuth connect/disconnect (`app/api/google/connect`, `app/api/google/callback`), AES-256-GCM token encryption at rest (`lib/google/crypto.ts`, app-layer rather than Supabase Vault — see its own code comment for why), automatic token refresh (`lib/google/tokens.ts`) so the unattended weekly cron stays connected, all 7 Sheets worksheets (`lib/google/sheets-schema.ts`, `lib/google/sheets.ts`), Drive folder structure + weekly report PDF (`lib/google/drive.ts`, `lib/google/report-pdf.ts`), the sync orchestrator hooked into `lib/scout/pipeline.ts` right after run completion (best-effort, isolated in its own try/catch so a Google failure never fails the parent run), and the opt-in reverse sync (Sheets Review Status/Reviewer Notes → Supabase, narrow column allow-list, `lib/google/reverse-sync.ts`) with a shared `publishCandidate()` (`lib/scout/publish-candidate.ts`) so a sheet-driven approval and an in-app approval always converge. Two new Trigger.dev scheduled tasks (`google-reverse-sync` daily, `google-sync-retry` hourly for failed syncs). Settings UI (`/settings`) shows live connection state, the spreadsheet link, and the reverse-sync toggle — no longer a disabled stub.

**Not built**: nothing from the original spec — the Trends worksheet is created with headers only (deliberately; trend detection itself is Phase 6 scope, populating it now would be fake data). Google OAuth app remains in unverified "Testing" mode (invite-only test users) — going fully public would need Google's verification review, tracked as part of the deferred multi-tenant plan (see project memory), not required for the admin-only usage this phase was built for.

## Phase 6 — Testing, Cost, Analytics, Recommendations (in progress)

**Entry**: Phase 5 exit criteria met.
**Scope**: Prompt Tester (multi-model), full cost dashboards, analytics (spec §65), audit log UI, import/export (TXT/CSV/JSON/Markdown/PDF, incl. to Drive), trend detection, personal recommendations (with opt-out).
**Exit**: All of spec §65/§46/§47/§48/§44 implemented and demonstrated.

**Built so far**: Cost dashboards (`/costs`, per `AI_COST_CONTROL.md` §4) — Daily/Weekly/Monthly cost, cost by feature, cost by model, cost by research run, all derived from `ai_usage_log`. Personal view (each user sees their own usage), not admin-wide. Closed two gaps found along the way: `research_run_id` was never populated on Prompt Scout's usage rows (now fixed in `lib/scout/pipeline.ts`/`lib/ai/usage.ts`), and the app's dark-mode chart palette failed accessibility validation (fixed in `app/globals.css` before any chart existed to inherit the bug). Also fixed, unrelated but found the same day: Prompt Improver was silently failing on longer prompts (`maxTokens` too low for its output schema, truncating mid-JSON).

Prompt Tester (`/prompt-tester`) — run a prompt against one or more models (Claude Opus/Sonnet/Haiku, GPT-5.1/Mini) and compare raw outputs side by side, with a pre-call cost estimate per model (`lib/costs/estimate.ts`) and per-model logging to `ai_usage_log`. Wires up the two stubs that were already in place (prompt detail page's "Test prompt" button, Sidebar nav entry). Added `AIProvider.generateText()` (`lib/ai/types.ts` + both providers) since the existing `generateStructured()` is hard-wired to schema-validated JSON — Tester needs a model's actual free-text output. Successful runs from a library prompt record tested models on `tested_models`, giving that already-defined-but-inert column (`supabase/migrations/0002_prompts.sql`) its first real use. Per-user soft caps stay deferred, same precedent as Builder/Improver.

Audit log UI (`/activity`, nav label "Activity") — a per-user view of their own audit trail, distinct from `/admin`'s existing cross-user feed. No schema/RLS changes needed (a user could already read their own `audit_log` rows). Human-readable labels for all 13 logged actions (`lib/activity/labels.ts`). Closed a gap found while testing: running Prompt Scout never logged anything at all (only approving/rejecting a candidate did) — added `scout_run.started` logging to both the manual run action and the Trigger.dev weekly cron.

Trend detection (`/prompt-scout/trends`) — an AI-generated weekly summary of emerging themes in Prompt Scout's discoveries, per your choice over a purely statistical (category-counting) approach. Closes the Phase 5 gap where the Google Sheets "Trends" worksheet was deliberately left header-only. New `trends` table (shared/single-tenant RLS, matching `sources`/`research_runs`). Decoupled from any single scout run — a new weekly Trigger.dev task (`detect-trends`, Sunday 03:00 UTC) analyzes the full calendar week's candidates, which may span multiple runs. Skips weeks with no data entirely (no AI call, no fabricated row), and the system prompt explicitly instructs the model to say so honestly rather than invent a pattern from weak signal. Found and fixed a real bug while testing: the query was feeding in candidates the analysis step had judged not useful (placeholder "N/A" titles, no description) alongside real ones — filtering on `description is not null` cleanly excludes that noise across every insert path in `pipeline.ts`.

General analytics (`/analytics`) — a personal view of your own library: prompts by category, top tags, an original/AI-discovered/AI-improved source breakdown, library growth over time, and most-favorited prompts. Wires up the Sidebar's disabled stub. Found two more dead columns matching the `tested_models`/Trend Detection pattern: `prompts.usage_count` is never incremented anywhere and is excluded entirely rather than showing a fake always-zero metric; `prompts.favorite_count` is also never synced, so favorite counts are derived live from the `favorites` table instead. Also fixed a `BarChart` bug this surfaced: its `formatValue` prop was a function, which Next.js rejects passing from a Server Component to a Client Component (`/costs` never hit this, since it only used the default) — changed to a serializable `format: "currency" | "integer"` string.

Import/export — one shared `ExportablePrompt[]` engine (`lib/export/`) reused across all three scopes (single prompt, collection, full library) and all five formats (TXT/MD/CSV/JSON/PDF), plus a "Save to Google Drive" destination that reuses Phase 5's `/Prompt Exports` folder. Import supports JSON (full round-trip), CSV (bulk), and TXT (whole file → one prompt); Markdown/PDF import were deliberately left out — parsing either back into structured fields isn't reliable. Found and fixed two real bugs during manual testing: downloading from the export dropdown menu intermittently failed ("Site wasn't available" in Chrome) because rendering the download link as a menu item raced the menu's close-on-select unmount against the in-flight request — fixed by triggering `window.open()` from a plain click handler instead, which runs synchronously before the unmount. PDF export 500'd on the full library because `pdf-lib`'s standard Helvetica font can't encode characters outside WinAnsi (curly quotes, emoji, non-Latin text) and throws on them — fixed by sanitizing text per-character before layout, substituting `?` for anything unencodable rather than crashing.

**Not built**: personal recommendations.

## Phase 7 — Hardening & Production

**Entry**: Phase 6 exit criteria met.
**Scope**: Security review pass (`/security-review`), performance pass (query plans, caching, pagination audit), Playwright e2e suite covering the golden paths across all phases, full error-handling audit, final production deployment checklist.
**Exit**: Spec §75 "Definition of Done" checklist fully satisfied.

## Cross-Phase Rules (never relaxed)

- No fake buttons — an unbuilt feature is disabled and labeled, never wired to a stub.
- No silent architectural decisions — anything ambiguous gets flagged to the user before being decided.
- Supabase remains the source of truth at every phase; Sheets/Drive never become authoritative.
- Every phase ends with lint + typecheck + tests green before being called done.
